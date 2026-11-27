import { projectRoleFor as projectRoleFor_ } from "./permissions.js";

const bool_ = (value) =>
  !["false", "no", "0", "n", ""].includes(
    String(value ?? "")
      .trim()
      .toLowerCase(),
  );

function diaryArray_(value) {
  if (Array.isArray(value)) return value;
  try {
    const result = JSON.parse(value || "[]");
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}
function diaryTimelineEvents_(meetings, visits, details, user) {
  const events = (meetings || []).map((m) => ({
    id: "meeting:" + m.id,
    aliases: [],
    projectId: String(m.projectId),
    title: m.title || "Project meeting",
    date: String(m.date || "").slice(0, 10),
    time: m.time || "",
    endTime: m.endTime || "",
    meetingMode: m.meetingMode || "",
    location: m.location || "",
    participants: m.participants || "",
    agenda: m.agenda || "",
    visitPlanId: m.visitPlanId || "",
    notes: m.mom || "",
    actions: m.actionItems || "",
    nextDate: m.nextDate || "",
    happened: bool_(m.happened),
    floors: diaryArray_(m.floors),
    workItems: diaryArray_(m.workItems),
    kind: "Meeting",
    cancelled: m.active === false || String(m.active).toLowerCase() === "false",
  }));
  for (const plan of visits || []) {
    for (const visit of diaryArray_(plan.history)) {
      const alias = "visit:" + plan.visitPlanId + ":" + visit.visitId;
      const matches = events.filter(
        (e) =>
          e.projectId === String(plan.projectId) &&
          String(e.visitPlanId) === String(plan.visitPlanId) &&
          e.date ===
            String(visit.scheduledFor || visit.date || "").slice(0, 10) &&
          String(e.notes).trim() === String(visit.notes || "").trim(),
      );
      if (matches.length === 1) {
        matches[0].aliases.push(
          alias,
          "scheduled:" +
            plan.visitPlanId +
            ":" +
            String(visit.scheduledFor || visit.date || "").slice(0, 10),
        );
        matches[0].happened = true;
        matches[0].visitId = String(visit.visitId);
        continue;
      }
      events.push({
        id: alias,
        visitId: String(visit.visitId),
        aliases: [
          "scheduled:" +
            plan.visitPlanId +
            ":" +
            String(visit.scheduledFor || visit.date || "").slice(0, 10),
        ],
        projectId: String(plan.projectId),
        title: plan.title || plan.milestone || "Site visit",
        date: String(visit.date || "").slice(0, 10),
        time: "",
        meetingMode: "Site visit",
        location: "",
        participants: visit.visitBy || "",
        agenda: "",
        visitPlanId: plan.visitPlanId,
        notes: visit.notes || "",
        actions: diaryArray_(visit.actionItems)
          .map((a) => [a.title, a.owner, a.dueDate].filter(Boolean).join(" | "))
          .join("\n"),
        nextDate: "",
        happened: true,
        floors: visit.coveredFloors || diaryArray_(plan.floors),
        workItems: visit.coveredWork || diaryArray_(plan.workItems),
        kind: "Visit",
      });
    }
    if (
      String(plan.active).toLowerCase() !== "false" &&
      plan.scheduledDate &&
      !events.some(
        (e) =>
          e.projectId === String(plan.projectId) &&
          String(e.visitPlanId) === String(plan.visitPlanId) &&
          e.date === String(plan.scheduledDate).slice(0, 10),
      )
    ) {
      events.push({
        id:
          "scheduled:" +
          plan.visitPlanId +
          ":" +
          String(plan.scheduledDate).slice(0, 10),
        aliases: [],
        projectId: String(plan.projectId),
        title: plan.title || plan.milestone || "Scheduled visit",
        date: String(plan.scheduledDate).slice(0, 10),
        time: "",
        meetingMode: "Site visit",
        location: "",
        participants: "",
        agenda: "",
        visitPlanId: plan.visitPlanId,
        notes: "",
        actions: "",
        nextDate: "",
        happened: false,
        floors: diaryArray_(plan.floors),
        workItems: diaryArray_(plan.workItems),
        kind: "Visit",
      });
    }
  }
  const represented = new Set(events.flatMap((e) => [e.id, ...e.aliases]));
  for (const detail of details) {
    if (represented.has(detail.entryId) || !detail.sourceSnapshotJson) continue;
    try {
      const snapshot = JSON.parse(detail.sourceSnapshotJson);
      events.push({
        ...snapshot,
        id: detail.entryId,
        aliases: [],
        archived: true,
      });
    } catch {}
  }
  return events
    .map((event) => {
      const row =
        details.find(
          (r) =>
            String(r.projectId) === event.projectId && r.entryId === event.id,
        ) ||
        details.find(
          (r) =>
            String(r.projectId) === event.projectId &&
            event.aliases.includes(r.entryId),
        );
      return {
        ...event,
        canEdit:
          String(user.appAccess).toLowerCase() !== "viewer" &&
          !!projectRoleFor_(user, String(event.projectId)),
        detail: row
          ? {
              ...row,
              photos: diaryArray_(row.photosJson),
              documents: diaryArray_(row.documentsJson),
            }
          : {
              version: "",
              summary: "",
              workDone: "",
              decisions: "",
              momText: "",
              photos: [],
              documents: [],
            },
      };
    })
    .sort(
      (a, b) =>
        String(b.date).localeCompare(String(a.date)) ||
        String(b.time).localeCompare(String(a.time)),
    );
}

function diaryMeetingParticipant_(user, meeting) {
  const normalize = (v) =>
      String(v || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase(),
    identities = new Set(
      [user.userId, user.email, user.name].map(normalize).filter(Boolean),
    );
  if (!identities.size) return false;
  const values = (value) => {
    if (Array.isArray(value)) return value.flatMap(values);
    if (value && typeof value === "object")
      return ["userId", "id", "email", "name", "label"].flatMap((k) =>
        values(value[k]),
      );
    const text = String(value || "").trim();
    if (!text) return [];
    if (/^[\[{]/.test(text)) {
      try {
        return values(JSON.parse(text));
      } catch {}
    }
    return text
      .split(/[,;|\n]| \/ /)
      .flatMap((v) => [
        normalize(v),
        ...(v.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map(
          normalize,
        ),
      ]);
  };
  return [meeting.participants, meeting.visitLeadId, meeting.scheduledByUserId]
    .flatMap(values)
    .some((value) => identities.has(value));
}

function momActionLines_(notes) {
  let selected = [],
    all = [],
    inActions = false,
    hasSections = false,
    follow = false;
  String(notes || "")
    .split(/\r?\n/)
    .forEach((raw) => {
      let line = raw
        .trim()
        .replace(/^#+\s*/, "")
        .replace(/^[-*•]\s*|^\d+[.)]\s*/, "")
        .replace(/\*\*/g, "");
      if (!line) return;
      const heading =
        /^(visit summary|discussion|decisions|action items?|next steps?|follow[ -]?ups?|to[ -]?do|open points)(?:\s*\([^)]*\))?\s*:?$/i.exec(
          line,
        );
      if (heading) {
        inActions = /action|next|follow|to[ -]?do/i.test(heading[1]);
        follow = /follow/i.test(heading[1]);
        hasSections = true;
        return;
      }
      if (
        /^(project|milestone|floor|date|visit date|visited by|attendees)\s*:/i.test(
          line,
        )
      )
        return;
      if (/^(none|not provided|no action items|n\/a)\.?$/i.test(line)) return;
      if (
        /^(action|task|item)\s*\|\s*(owner|responsible)/i.test(line) ||
        /^[|:\s-]+$/.test(line)
      )
        return;
      if (inActions) selected.push(follow ? "Follow-up: " + line : line);
      all.push(line);
    });
  return hasSections ? selected : all;
}

function diaryMinutes_(events, tasks, pointRows) {
  return events.map((event) => {
    const pid = String(event.projectId),
      visitId = String(
        event.visitId ||
          (String(event.id).startsWith("visit:")
            ? String(event.id).split(":").at(-1)
            : ""),
      );
    const matches = (row) =>
      String(row.projectId) === pid &&
      (visitId
        ? String(row.visitId) === visitId
        : !!event.visitPlanId &&
          String(row.visitPlanId) === String(event.visitPlanId) &&
          String(row.visitDate || "").slice(0, 10) ===
            String(event.date).slice(0, 10));
    const actionRows = tasks.filter(matches),
      used = new Set();
    let structured = [];
    const ids = visitId
      ? [visitId]
      : [
          ...new Set(
            actionRows.map((r) => String(r.visitId || "")).filter(Boolean),
          ),
        ];
    for (const id of ids) {
      const rows = pointRows
        .filter(
          (r) =>
            String(r.projectId) === pid &&
            String(r.visitId) === id &&
            (!event.visitPlanId ||
              String(r.visitPlanId) === String(event.visitPlanId)),
        )
        .sort((a, b) => Number(a.position) - Number(b.position));
      for (const r of rows) {
        let p;
        try {
          p = JSON.parse(r.recordJson);
        } catch {
          continue;
        }
        if (!p || !p.id || !String(p.text || "").trim()) continue;
        const task = actionRows.find(
          (t) =>
            String(t.visitId) === id &&
            String(t.pointId || "") === String(p.id),
        );
        if (task) used.add(String(task.momTaskId));
        structured.push({
          id: id + ":" + p.id,
          text: String(p.text),
          action: p.action !== false,
          task: task || null,
          photos: Array.isArray(p.photos) ? p.photos : [],
          circuit: p.circuit || null,
          owner: task ? task.owner || "" : p.owner || "",
          dueDate: p.dueDate || "",
        });
      }
    }
    const photos = (row) => {
      try {
        const list = JSON.parse(row.photosJson || "[]");
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    };
    const points = [
      ...structured,
      ...actionRows
        .filter((t) => !used.has(String(t.momTaskId)))
        .map((t) => ({
          id: String(t.momTaskId),
          text: String(t.title || ""),
          action: true,
          task: t,
          photos: photos(t),
          circuit: null,
          owner: t.owner || "",
          dueDate: t.dueDate || "",
        })),
    ];
    if (!points.length) {
      const text = String(
        event.actions || event.notes || event.detail?.momText || "",
      ).trim();
      if (text) {
        const lines =
          typeof momActionLines_ === "function"
            ? momActionLines_(text)
            : text
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean);
        lines.forEach((text, i) =>
          points.push({
            id: "legacy:" + event.id + ":" + i,
            text,
            action: true,
            task: null,
            photos: [],
            circuit: null,
          }),
        );
      }
    }
    return { ...event, minutePoints: points };
  });
}

function recordDate_(value) {
  const s = String(value || ""),
    day = s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}(?:$|T| )/.test(s) &&
    Number.isFinite(Date.parse(day + "T00:00:00Z")) &&
    new Date(day + "T00:00:00Z").toISOString().slice(0, 10) === day
    ? s
    : "";
}
function recordDay_(value) {
  const date = recordDate_(value);
  if (!date) return "";
  return /[T ]\d{2}:\d{2}/.test(date) && Number.isFinite(Date.parse(date))
    ? new Date(Date.parse(date) + 330 * 60000).toISOString().slice(0, 10)
    : date.slice(0, 10);
}

function recordUrl_(row) {
  const url = String(row.driveUrl || row.url || "");
  if (/^https:\/\/[^\s]+$/.test(url)) return url;
  const id = String(row.driveFileId || "");
  return id
    ? "https://drive.google.com/file/d/" + encodeURIComponent(id) + "/view"
    : "";
}
function meetingRecordTiming_(event, sessions, events) {
  const identities = new Set([
      String(event.id),
      ...(event.aliases || []).map(String),
    ]),
    pid = String(event.projectId),
    day = String(event.date).slice(0, 10);
  const planMatches = events.filter(
    (e) =>
      String(e.projectId) === pid &&
      String(e.visitPlanId || "") === String(event.visitPlanId || "") &&
      String(e.date).slice(0, 10) === day,
  );
  const recorded = [];
  for (const s of sessions) {
    let key;
    try {
      key = JSON.parse(s.key);
    } catch {
      continue;
    }
    if (
      !Array.isArray(key) ||
      key.length !== 4 ||
      String(key[2]) !== pid ||
      String(key[1]) !== day
    )
      continue;
    const id = String(key[3]);
    if (
      !identities.has(id) &&
      !(
        event.visitPlanId &&
        planMatches.length === 1 &&
        id === "visit:" + event.visitPlanId
      )
    )
      continue;
    const start = recordDate_(s.startAt),
      end = recordDate_(s.endAt);
    if (
      !start ||
      !/[T ]\d{2}:\d{2}/.test(start) ||
      !Number.isFinite(Date.parse(start))
    )
      continue;
    recorded.push({
      userId: String(s.userId || key[0] || ""),
      start,
      end:
        end &&
        /[T ]\d{2}:\d{2}/.test(end) &&
        Date.parse(end) >= Date.parse(start)
          ? end
          : "",
    });
  }
  if (recorded.length) {
    const start = recorded
        .map((s) => s.start)
        .sort((a, b) => Date.parse(a) - Date.parse(b))[0],
      complete = recorded.every((s) => s.end),
      end = complete
        ? recorded
            .map((s) => s.end)
            .sort((a, b) => Date.parse(b) - Date.parse(a))[0]
        : "";
    return {
      source: "recorded",
      start,
      end,
      durationMinutes: end
        ? Math.round((Date.parse(end) - Date.parse(start)) / 60000)
        : null,
      sessions: recorded,
    };
  }
  if (event.time || event.endTime)
    return {
      source: "scheduled",
      start: String(event.time || ""),
      end: String(event.endTime || ""),
      durationMinutes: null,
      sessions: [],
    };
  return {
    source: "unknown",
    start: "",
    end: "",
    durationMinutes: null,
    sessions: [],
  };
}
function projectDrawingHistory_(drawings, files, tasks, issued) {
  const rows = new Map(),
    outputFiles = new Set();
  const list = (value) => {
    if (Array.isArray(value)) return value.map(String);
    try {
      const a = JSON.parse(value);
      if (Array.isArray(a)) return a.map(String);
    } catch {}
    return String(value || "")
      .split(/\s*[,;]\s*/)
      .filter(Boolean);
  };
  const add = (kind, row, date, title, note = "", identity = "") => {
    if (row.trashed === true || String(row.trashed).toLowerCase() === "true")
      return;
    date = recordDate_(date);
    const pid = String(row.projectId),
      file = String(
        row.driveFileId ||
          row.sourceFileId ||
          row.fileId ||
          row.drawingId ||
          row.designTaskId ||
          row.issueId ||
          "",
      ),
      revision = String(row.revisionNo || row.revision || "");
    const key = [pid, kind, identity || file, revision, recordDay_(date)].join(
      "|",
    );
    let event = rows.get(key);
    if (!event) {
      event = {
        id: "history:" + key,
        projectId: pid,
        kind,
        date,
        title,
        fileName: String(row.fileName || ""),
        url: recordUrl_(row),
        revision,
        drawingCode: String(row.drawingCode || row.designNo || ""),
        drawingTypes: [],
        floors: [],
        areas: [],
        people: [],
        sourceIds: [],
        note,
      };
      rows.set(key, event);
    }
    if (
      kind === "drawing-completed" &&
      Date.parse(date) > Date.parse(event.date)
    )
      event.date = date;
    if (!event.url || row.archiveFileId) event.url = recordUrl_(row);
    if (!event.fileName) event.fileName = String(row.fileName || "");
    for (const [field, values] of [
      ["drawingTypes", list(row.drawingType || row.taskType)],
      ["floors", list(row.floorTags || row.floors || row.floor)],
      ["areas", list(row.area)],
      [
        "people",
        list(
          row.uploadedBy || row.updatedBy || row.createdBy || row.assigneeName,
        ),
      ],
    ])
      event[field] = [...new Set([...event[field], ...values])];
    event.sourceIds = [
      ...new Set([
        ...event.sourceIds,
        ...[row.drawingId, row.fileId, row.designTaskId, row.issueId]
          .filter(Boolean)
          .map(String),
      ]),
    ];
  };
  const sourceDrawings = new Map(
    drawings
      .filter((r) => !r.trashed || String(r.trashed).toLowerCase() === "false")
      .map((r) => [String(r.projectId) + "|" + String(r.drawingId), r]),
  );
  for (const row of drawings) {
    const direction = String(row.direction || "Received").toLowerCase();
    if (direction !== "received") continue;
    const date = row.receivedSentDate || row.originalDate;
    add(
      "drawing-received",
      row,
      date || row.createdAt || row.uploadedAt,
      "Drawing received",
      date ? "" : "Received date not recorded; showing registration date.",
    );
  }
  for (const task of tasks) {
    if (
      !recordDate_(task.completedAt) ||
      !/^completed$/i.test(String(task.status || "")) ||
      /^Skipped:/i.test(String(task.remarks || ""))
    )
      continue;
    const linked = files.filter(
      (f) =>
        String(f.projectId) === String(task.projectId) &&
        (((String(f.fileId) === String(task.completedFileId || "") ||
          String(f.driveFileId || "") === String(task.completedFileId || "")) &&
          !!task.completedFileId) ||
          (String(f.linkedEntityId) === String(task.designTaskId) &&
            /output|sent/i.test(
              String(f.direction || f.folderCategory || ""),
            ))),
    );
    const isDrawing =
      linked.length ||
      task.completedFileId ||
      /drawing|layout|rcp|lighting plan|wiring|dialux|marking sheet|spec.*sheet|technical table/i.test(
        String(task.taskType || ""),
      );
    if (!isDrawing) continue;
    for (const file of linked.length ? linked : [{}]) {
      if (
        file.trashed === true ||
        String(file.trashed).toLowerCase() === "true"
      )
        continue;
      const row = {
        ...task,
        ...file,
        projectId: task.projectId,
        designTaskId: task.designTaskId,
        taskType: task.taskType,
      };
      add(
        "drawing-completed",
        row,
        task.completedAt,
        "Drawing completed",
        file.fileId ? "" : "No output file is linked to this completion.",
        file.driveFileId || file.fileId || task.designTaskId,
      );
      if (file.fileId)
        outputFiles.add(String(file.projectId) + "|" + String(file.fileId));
    }
  }
  for (const file of files) {
    const direction = String(
      file.direction || file.folderCategory || "",
    ).toLowerCase();
    if (direction === "received") {
      const original = sourceDrawings.get(
        String(file.projectId) + "|" + String(file.linkedEntityId),
      );
      const date =
        original?.receivedSentDate ||
        file.receivedSentDate ||
        file.originalDate;
      add(
        "drawing-received",
        {
          ...file,
          ...(original || {}),
          projectId: file.projectId,
          driveFileId: original?.driveFileId || file.driveFileId,
          driveUrl: original?.driveUrl || file.driveUrl,
          fileId: original?.fileId || file.fileId,
        },
        date || file.uploadedAt,
        "Drawing received",
        date ? "" : "Received date not recorded; showing upload date.",
      );
    } else if (
      direction === "output" &&
      !outputFiles.has(String(file.projectId) + "|" + String(file.fileId))
    ) {
      add(
        "drawing-output",
        file,
        file.originalDate || file.receivedSentDate || file.uploadedAt,
        "Drawing output recorded",
        "Output record date; no separate completion timestamp is available.",
      );
    } else if (direction === "sent") {
      add(
        "drawing-issued",
        file,
        file.receivedSentDate || file.originalDate || file.uploadedAt,
        "Drawing issued / sent",
        file.receivedSentDate || file.originalDate
          ? ""
          : "Sent date not recorded; showing upload date.",
      );
    }
  }
  for (const row of issued) {
    add(
      "drawing-issued",
      {
        ...row,
        driveFileId: row.sourceFileId,
        driveUrl: row.archiveFileId
          ? "https://drive.google.com/file/d/" +
            encodeURIComponent(row.archiveFileId) +
            "/view"
          : "",
      },
      row.issuedDate || row.createdAt,
      "Drawing issued / sent",
      row.issuedDate
        ? ""
        : "Issued date not recorded; showing registration date.",
    );
  }
  return [...rows.values()];
}

export {
  diaryArray_,
  diaryTimelineEvents_,
  diaryMeetingParticipant_,
  diaryMinutes_,
  recordDate_,
  meetingRecordTiming_,
  projectDrawingHistory_,
};
