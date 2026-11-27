function technicalText_(v, max) {
  const s = String(v || "").trim();
  if (s.length > max) throw Error("Technical table label is too long.");
  if (/^[=+@]/.test(s)) throw Error("Enter a plain text label.");
  return s;
}
function technicalProductUrl_(v) {
  const url = String(v || "").trim();
  if (
    url.length > 2000 ||
    (url &&
      !/^https:\/\/[^\s]+$/.test(url) &&
      !/^\/(?:technical-library|application-library)\/[\w.-]+$/.test(url))
  )
    throw Error("Use an HTTPS asset URL.");
  return url;
}
export function buildTechnicalFitting(input) {
  if (!input || !input.id) throw Error("Choose a fitting.");
  const row = { id: technicalText_(input.id, 100) };
  for (const k of [
    "fittingType",
    "brand",
    "x",
    "pcbWidth",
    "standardLengths",
    "wattage",
  ])
    row[k] = technicalText_(input[k], 500);
  if (!row.fittingType) throw Error("Fitting type is required.");
  for (const k of ["iconUrl", "thumbnailUrl"]) {
    row[k] = String(input[k] || "").trim();
    if (
      row[k] &&
      !/^https:\/\/[^\s]+$/.test(row[k]) &&
      !/^\/technical-library\/[\w.-]+$/.test(row[k])
    )
      throw Error(
        "Use an HTTPS image URL or an existing technical-library asset.",
      );
    if (row[k].length > 2000) throw Error("Image URL too long.");
  }
  if (input.cataloguePlacement != null) {
    const placement = input.cataloguePlacement;
    if (
      typeof placement !== "object" ||
      !/^(row-[0-9]+|additional)$/.test(String(placement.group || "")) ||
      typeof placement.order !== "number" ||
      !Number.isFinite(placement.order) ||
      Math.abs(placement.order) > 1e12
    )
      throw Error("Invalid product type position.");
    row.cataloguePlacement = {
      group: String(placement.group),
      order: placement.order,
    };
  }
  row.category = technicalText_(input.category || "", 150);
  row.applicationImageId = technicalText_(input.applicationImageId || "", 150);
  row.preferredProductId = technicalText_(input.preferredProductId || "", 100);
  if (!Array.isArray(input.products) && input.products != null)
    throw Error("Invalid product list.");
  row.products = (input.products || []).slice(0, 100).map((v) => {
    const product = {};
    for (const k of ["id", "brand", "model", "family", "notes"])
      product[k] = technicalText_(v[k] || "", k === "notes" ? 1000 : 150);
    if (!product.id || !product.brand || !product.model)
      throw Error("Enter brand and model for every product.");
    product.imageUrl = String(v.imageUrl || "").trim();
    if (
      product.imageUrl &&
      !/^https:\/\/[^\s]+$/.test(product.imageUrl) &&
      !/^\/technical-library\/[\w.-]+$/.test(product.imageUrl)
    )
      throw Error("Use an HTTPS product image URL.");
    if (product.imageUrl.length > 2000) throw Error("Image URL too long.");
    product.ratings = {};
    for (const k of ["cutoff", "led", "driver", "build"]) {
      const value = Number(v.ratings?.[k] || 0);
      if (!Number.isInteger(value) || value < 0 || value > 5)
        throw Error("Invalid product rating.");
      product.ratings[k] = value;
    }
    product.brandLogoUrl = technicalProductUrl_(v.brandLogoUrl || "");
    product.specs = {};
    const source = v.specs || {};
    for (const k of [
      "article",
      "power",
      "flux",
      "size",
      "recess",
      "height",
      "cri",
      "life",
      "warranty",
      "mrp",
      "price",
      "maintenance",
      "lmf",
      "currency",
      "shape",
      "ip",
      "photometry",
    ]) {
      product.specs[k] = technicalText_(
        source[k] ?? "",
        k === "photometry" ? 6000 : 200,
      );
    }
    for (const k of [
      "power",
      "flux",
      "size",
      "recess",
      "height",
      "cri",
      "life",
      "warranty",
      "mrp",
      "price",
      "maintenance",
    ]) {
      const value = product.specs[k];
      if (
        value !== "" &&
        (!isFinite(Number(value)) ||
          Number(value) < 0 ||
          (k === "cri" && Number(value) > 100) ||
          (k === "maintenance" && Number(value) > 1))
      )
        throw Error("Invalid " + k + " value.");
    }
    for (const k of [
      "diagramUrl",
      "datasheet",
      "lm80",
      "tm30",
      "certificate",
      "ies",
      "maintenanceAttachmentUrl",
      "lmfAttachmentUrl",
    ])
      product.specs[k] = technicalProductUrl_(source[k] || "");
    if (source.familyView != null) {
      if (
        typeof source.familyView !== "object" ||
        Array.isArray(source.familyView)
      )
        throw Error("Invalid family view.");
      product.specs.familyView = {};
      for (const key of [
        "construction",
        "led",
        "colour",
        "distribution",
        "mounting",
        "control",
        "diameter",
        "depth",
        "cutout",
        "beam",
      ]) {
        if (!Object.prototype.hasOwnProperty.call(source.familyView, key))
          continue;
        const value = technicalText_(source.familyView[key] ?? "", 300);
        if (
          value !== "" &&
          ["diameter", "depth", "cutout", "beam"].includes(key)
        ) {
          const number = Number(value);
          if (
            !Number.isFinite(number) ||
            number <= 0 ||
            (key === "beam" && number >= 180)
          )
            throw Error("Invalid family view " + key + ".");
        }
        product.specs.familyView[key] = value;
      }
    }
    for (const k of [
      "colour",
      "spectra",
      "distribution",
      "control",
      "infrastructure",
    ]) {
      if (source[k] != null && !Array.isArray(source[k]))
        throw Error("Invalid " + k + " options.");
      product.specs[k] = (source[k] || [])
        .slice(0, 30)
        .map((x) => technicalText_(x, 100));
    }
    if (source.specSheet != null) {
      const detail = source.specSheet;
      if (typeof detail !== "object" || Array.isArray(detail))
        throw Error("Invalid spec sheet details.");
      product.specs.specSheet = {};
      for (const key of [
        "designIntent",
        "trimColor",
        "reflectorColor",
        "dimensions",
        "mounting",
        "aiming",
        "weight",
        "ik",
        "r9",
        "optics",
        "ugr",
        "sdcm",
        "brightness",
        "driverType",
        "driverWattage",
        "voltage",
        "electricalClass",
        "ambient",
        "maximum",
        "thd",
        "powerFactor",
        "energy",
        "lifeRating",
        "lifeYears",
        "customization",
        "accessories",
        "equivalents",
        "notes",
        "sampleApproval",
      ])
        product.specs.specSheet[key] = technicalText_(detail[key] ?? "", 1000);
      for (const key of ["photometricUrl", "symbolsUrl", "controlDiagramUrl"])
        product.specs.specSheet[key] = technicalProductUrl_(detail[key] || "");
      if (detail.highlights != null) {
        const allowed = [
          "shape",
          "trim",
          "dimensions",
          "mounting",
          "weight",
          "ip",
          "ik",
          "cct",
          "optics",
          "cri",
          "sdcm",
          "brightness",
          "driver",
          "dimming",
          "voltage",
          "electricalClass",
          "temperature",
          "thd",
          "energy",
          "life",
          "lifeYears",
          "customization",
        ];
        if (
          !Array.isArray(detail.highlights) ||
          detail.highlights.some((k) => !allowed.includes(k))
        )
          throw Error("Invalid spec sheet highlights.");
        product.specs.specSheet.highlights = [...new Set(detail.highlights)];
      }
    }
    if (v.linearApplicationIds !== undefined) {
      if (
        !Array.isArray(v.linearApplicationIds) ||
        v.linearApplicationIds.length > 500 ||
        v.linearApplicationIds.some(
          (id) => typeof id !== "string" || !id.trim() || id.length > 200,
        )
      ) {
        throw Error("Invalid linear application associations.");
      }
      product.linearApplicationIds = [...new Set(v.linearApplicationIds)];
    }
    product.rating = Number(v.rating || 0);
    if (
      !Number.isInteger(product.rating) ||
      product.rating < 0 ||
      product.rating > 5
    )
      throw Error("Rating must be between 0 and 5.");
    return product;
  });
  if (JSON.stringify(row).length > 42000)
    throw Error("Too much product data for one fitting.");
  if (new Set(row.products.map((v) => v.id)).size !== row.products.length)
    throw Error("Duplicate product identifier.");
  if (
    row.preferredProductId &&
    !row.products.some((v) => v.id === row.preferredProductId)
  )
    throw Error("Choose a saved preferred product.");
  return row;
}
