// Output validation ported from TechnicalDocumentation.gs.
export function validateDocumentation(p) {
  const validCell = (v) => typeof v === "string" && v.length <= 4000;
  if (
    !Array.isArray(p.headers) ||
    p.headers.length > 80 ||
    !p.headers.every(validCell) ||
    !Array.isArray(p.rows) ||
    p.rows.length > 2000 ||
    p.rows.some(
      (r) =>
        !Array.isArray(r) ||
        r.length !== p.headers.length ||
        !r.every(validCell),
    )
  )
    throw Error("Invalid Output: use up to 2,000 rows and 80 columns.");
  const rules = {};
  if (p.rules === null || typeof p.rules !== "object" || Array.isArray(p.rules))
    throw Error("Invalid column sources.");
  Object.keys(p.rules).forEach((k) => {
    if (!/^(?:[0-9]|1[01])$/.test(k))
      throw Error("Invalid Technical Table column.");
    const r = p.rules[k];
    if (
      !r ||
      ![
        "",
        "output",
        "products",
        "applications",
        "derived",
        "floorZones",
        "manual",
      ].includes(r.source || "") ||
      typeof (r.notes || "") !== "string" ||
      String(r.notes || "").length > 2000
    )
      throw Error("Invalid column source.");
    const field = String(r.field || "");
    if (field && !/^\d{1,2}$/.test(field)) throw Error("Invalid Output field.");
    if (r.source === "output" && field && Number(field) >= p.headers.length)
      throw Error("Output field no longer exists.");
    rules[k] = { source: r.source || "", field, notes: r.notes || "" };
  });
  const overrides = {};
  if (p.overrides !== undefined) {
    if (
      !p.overrides ||
      typeof p.overrides !== "object" ||
      Array.isArray(p.overrides) ||
      Object.keys(p.overrides).length > 2000
    )
      throw Error("Invalid circuit edits.");
    Object.keys(p.overrides).forEach((k) => {
      if (
        k.length > 150 ||
        ["__proto__", "constructor", "prototype"].includes(k)
      )
        throw Error("Invalid circuit key.");
      const value = p.overrides[k];
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw Error("Invalid circuit edit.");
      const edit = {};
      if (Object.prototype.hasOwnProperty.call(value, "lighting")) {
        if (
          ![
            "Fill",
            "Focused",
            "Decorative",
            "Joinery",
            "Unclassified",
          ].includes(value.lighting)
        )
          throw Error("Invalid lighting category.");
        edit.lighting = value.lighting;
      }
      if (Object.prototype.hasOwnProperty.call(value, "cmf")) {
        if (typeof value.cmf !== "string" || value.cmf.length > 2000)
          throw Error("Invalid CMF.");
        edit.cmf = value.cmf;
      }
      ["fixture", "image3d", "reference"].forEach((kind) => {
        if (!Object.prototype.hasOwnProperty.call(value, kind)) return;
        const media = value[kind];
        if (media === null) {
          edit[kind] = null;
          return;
        }
        if (
          !media ||
          typeof media.url !== "string" ||
          media.url.length > 2000 ||
          !/^(https:\/\/|\/(?!\/))/.test(media.url)
        )
          throw Error("Invalid image URL.");
        const out = {
          url: media.url,
          driveFileId: String(media.driveFileId || "").slice(0, 200),
          id: String(media.id || "").slice(0, 200),
          label: String(media.label || "").slice(0, 500),
        };
        ["zoom", "x", "y"].forEach((prop) => {
          const n = Number(media[prop] ?? (prop === "zoom" ? 1 : 50));
          if (
            !Number.isFinite(n) ||
            n < (prop === "zoom" ? 1 : 0) ||
            n > (prop === "zoom" ? 5 : 100)
          )
            throw Error("Invalid image framing.");
          out[prop] = n;
        });
        edit[kind] = out;
      });
      overrides[k] = edit;
    });
  }
  if (
    p.sourceText !== undefined &&
    (typeof p.sourceText !== "string" || p.sourceText.length > 1200000)
  )
    throw Error("Invalid original Output text.");
  if (
    p.sourceName !== undefined &&
    (typeof p.sourceName !== "string" || p.sourceName.length > 250)
  )
    throw Error("Invalid Output filename.");
  const manualRows = [];
  if (p.manualRows !== undefined) {
    if (!Array.isArray(p.manualRows) || p.manualRows.length > 2000)
      throw Error("Invalid added rows.");
    const seen = new Set();
    for (const row of p.manualRows) {
      if (
        !row ||
        typeof row.id !== "string" ||
        !/^manual-[a-zA-Z0-9-]{1,100}$/.test(row.id) ||
        !Number.isInteger(row.rowIndex) ||
        row.rowIndex < 0 ||
        row.rowIndex >= p.rows.length ||
        seen.has(row.rowIndex)
      )
        throw Error("Invalid added row.");
      seen.add(row.rowIndex);
      manualRows.push({ id: row.id, rowIndex: row.rowIndex });
    }
  }
  const data = { headers: p.headers, rows: p.rows, rules, overrides };
  if (p.manualRows !== undefined) data.manualRows = manualRows;
  if (p.sourceText !== undefined) data.sourceText = p.sourceText;
  if (p.sourceName !== undefined) data.sourceName = p.sourceName;
  const json = JSON.stringify(data);
  if (json.length > 1200000) throw Error("Output exceeds 1.2 MB.");
  return data;
}
