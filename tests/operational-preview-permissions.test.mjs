import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Pool} from 'pg';
import handler, {createAppSession} from '../api/index.js';
import {loadOperationalIdentity, loadOperationalUser, requireProject, requireStudio} from '../server/permissions.js';

const identity = {email:'system.enlighten@gmail.com', sub:'verified-google-subject'};
const env = {VERCEL_ENV:'preview', SUPABASE_OPERATIONAL_ACCESS:'1', MIGRATION_ADMIN_EMAIL:identity.email};
const administrator = {userId:'employee-1', active:true, googleSubject:identity.sub, appAccess:'Admin'};

function operationalDatabase(members, roles = []) {
  return {
    async transaction(work, options) {
      assert.deepEqual(options, {readOnly:true});
      return work({
        async rows(sql, parameters) {
          if (sql.includes('enlighten_operational.people')) {
            assert.deepEqual(parameters, [identity.email]);
            return members.map(cells => ({cells}));
          }
          assert.match(sql, /enlighten_operational\.project_roles/);
          assert.deepEqual(parameters, [administrator.userId]);
          return roles.map(cells => ({cells}));
        }
      });
    }
  };
}

test('operational preview authorizes a pre-bound administrator from PostgreSQL', async () => {
  const database = operationalDatabase([administrator], [
    {userId:administrator.userId, projectId:'project-1', projectRole:'Admin', active:true},
    {userId:administrator.userId, projectId:'project-2', projectRole:'User', active:false}
  ]);
  const user = await loadOperationalUser(identity, {env, database});
  assert.equal(user.userId, administrator.userId);
  assert.equal(user.projectRoles['project-1'], 'Admin');
  assert.equal(user.projectRoles['project-2'], undefined);
});

test('operational preview rejects ineligible database accounts and unbound identities', async () => {
  for (const members of [
    [], [administrator, administrator], [{...administrator, active:false}],
    [{...administrator, appAccess:'Viewer'}], [{...administrator, googleSubject:'different'}],
    [{...administrator, googleSubject:''}]
  ]) {
    await assert.rejects(loadOperationalUser(identity, {env, database:operationalDatabase(members)}), {statusCode:403});
  }
});

test('operational preview rejects production and mismatched administrators before querying', async () => {
  const database = {transaction: () => assert.fail('authorization should fail before querying')};
  await assert.rejects(loadOperationalUser(identity, {env:{...env, VERCEL_ENV:'production'}, database}), {statusCode:403});
  await assert.rejects(loadOperationalUser(identity, {env:{...env, MIGRATION_ADMIN_EMAIL:'other@example.com'}, database}), {statusCode:403});
});

test('first sign-in binds the employee and resolves department and project permissions', async () => {
  const employee = {userId:'employee-2', active:true, appAccess:'User', department:'Bookkeeping'};
  const writes = [];
  const database = {
    transaction: work => work({
      async rows(sql, parameters) {
        if (sql.includes('enlighten_operational.people')) {
          assert.match(sql, /FOR UPDATE/);
          assert.deepEqual(parameters, ['employee@example.test']);
          return [{record_id:'7', cells:employee}];
        }
        if (sql.includes('enlighten_operational.departments')) return [{cells:{name:'Bookkeeping', masterId:'WS-accounts'}}];
        assert.match(sql, /enlighten_operational\.project_roles/);
        return [{cells:{userId:employee.userId, projectId:'project-1', projectRole:'Admin', active:true}}];
      },
      async query(sql, parameters) {writes.push({sql, parameters});}
    })
  };
  const verified = {email:'employee@example.test', sub:'employee-google-subject'};
  const user = await loadOperationalIdentity(verified, {env, database});
  assert.equal(user.departmentKey, 'accounts');
  assert.equal(user.canChooseDepartment, false);
  assert.equal(requireProject(user, 'project-1', {write:true, admin:true}), 'Admin');
  assert.throws(() => requireProject(user, 'another-project'), {statusCode:403});
  assert.equal(writes.length, 1);
  assert.match(writes[0].sql, /jsonb_set/);
  assert.deepEqual(writes[0].parameters, [verified.sub, '7']);
  employee.googleSubject = 'different-subject';
  await assert.rejects(loadOperationalIdentity(verified, {env, database}), {statusCode:403});
  assert.equal(writes.length, 1);
});

test('contractor portal identity cannot acquire employee or project permissions', async () => {
  const database = {
    transaction: work => work({
      async rows(sql) {
        if (sql.includes('enlighten_operational.people')) return [];
        assert.match(sql, /enlighten_operational\.drawing_portal_access/);
        return [
          {cells:{active:false, name:'Inactive'}},
          {cells:{active:true, name:'Disabled'}, setting:{enabled:false}},
          {cells:{active:true, name:'Contractor'}}
        ];
      }
    })
  };
  const user = await loadOperationalIdentity({email:'contractor@example.test',sub:'portal-subject'}, {env,database});
  assert.equal(user.name, 'Contractor');
  assert.equal(user.appAccess, 'Contractor');
  assert.throws(() => requireStudio(user), {statusCode:403});
  assert.throws(() => requireProject(user, 'project-1'), {statusCode:403});
});

test('listProjects uses PostgreSQL through the normal API with Apps Script unset', async t => {
  const configuration = {
    ...env, APPS_SCRIPT_URL:undefined, SUPABASE_DIRECT_OPERATIONAL_READS:'1',
    ENLIGHTEN_PROXY_SECRET:'test-secret-for-operational-preview-only',
    GOOGLE_CLIENT_ID:'test-client', VERCEL_GIT_COMMIT_REF:'supabase-consolidated', SUPABASE_PREVIEW_DRIVE_ROOT_ID:'preview-root',GOOGLE_DRIVE_FOLDER_ID:'preview-root', SUPABASE_PREVIEW_PROJECT_REF:'abcdefghijklmnopqrst',
    SUPABASE_PREVIEW_DATABASE_URL:'postgresql://postgres@db.abcdefghijklmnopqrst.supabase.co/test',
    SUPABASE_DB_CA:'-----BEGIN CERTIFICATE-----'
  };
  for (const [key, value] of Object.entries(configuration)) {
    const previous = process.env[key];
    t.after(() => previous === undefined ? delete process.env[key] : (process.env[key] = previous));
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  t.mock.method(Pool.prototype, 'connect', async () => ({
    async query(sql) {
      if (sql.includes('enlighten_operational.people')) return {rows:[{cells:administrator}]};
      return {rows:[]};
    },
    release() {}
  }));
  const project = {projectId:'preview-project'};
  t.mock.method(Pool.prototype, 'query', async sql => {
    assert.match(sql, /enlighten_operational\.projects/);
    return {rows:[{cells:project}]};
  });
  const host = 'preview.example.test';
  const session = createAppSession(identity, configuration.ENLIGHTEN_PROXY_SECRET, configuration.GOOGLE_CLIENT_ID, host);
  const headers = {};
  const response = {
    setHeader(name, value) {headers[name] = value;},
    status(code) {this.code = code; return this;},
    json(body) {this.body = body;}
  };
  await handler({method:'GET', query:{action:'listProjects'}, headers:{host, cookie:'enlighten_session='+session}}, response);
  assert.equal(response.code, 200);
  assert.equal(headers['X-Enlighten-Data-Source'], 'supabase-operational');
  assert.deepEqual(response.body, {ok:true, data:[project]});
});
