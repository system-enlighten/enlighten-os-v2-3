/** Standalone web app for private technical export images. */
function doPost(e) {
  try {
    var request = JSON.parse(e.postData.contents);
    var config = PropertiesService.getScriptProperties();
    var secret = config.getProperty('TECHNICAL_IMAGE_BRIDGE_SECRET');
    var root = config.getProperty('TECHNICAL_IMAGE_BRIDGE_ROOT_ID');
    if (!secret || secret.length < 32 || !root || typeof request.body !== 'string' ||
        !/^[a-f0-9]{64}$/.test(request.signature || '')) throw Error('Invalid request.');
    var expected = Utilities.computeHmacSha256Signature(request.body, secret)
      .map(function(byte) { return (byte & 255).toString(16).padStart(2, '0'); }).join('');
    var difference = 0;
    for (var index = 0; index < expected.length; index++) difference |= expected.charCodeAt(index) ^ request.signature.charCodeAt(index);
    if (difference) throw Error('Invalid signature.');
    var command = JSON.parse(request.body), p = command.payload;
    if (!Number.isFinite(command.at) || Math.abs(Date.now() - command.at) > 120000 ||
        !['addImages','verifyImages'].includes(command.action) || !p || p.rootId !== root ||
        !/^[A-Za-z0-9_-]{5,200}$/.test(p.spreadsheetId)) throw Error('Invalid export request.');
    var file = DriveApp.getFileById(p.spreadsheetId);
    if (file.isTrashed() || file.getMimeType() !== 'application/vnd.google-apps.spreadsheet' || !insidePreviewRoot(file,root)) {
      throw Error('Spreadsheet is outside the Preview root.');
    }
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var sheet = SpreadsheetApp.openById(p.spreadsheetId).getSheetByName('Technical Table');
      if (!sheet) throw Error('Technical Table sheet is missing.');
      var titles = new Set(sheet.getImages().map(function(image) { return image.getAltTextTitle(); }));
      var validKey = function(key) { return /^image-\d+-\d+$/.test(key); };
      if (command.action === 'verifyImages') {
        if (!Array.isArray(p.keys) || p.keys.length > 6000 || p.keys.some(function(key) {return !validKey(key);})) throw Error('Invalid manifest.');
        return output({ok:true,data:{complete:p.keys.every(function(key) {return titles.has('enlighten-'+key);})}});
      }
      if (!Array.isArray(p.images) || !p.images.length || p.images.length > 6) throw Error('Invalid image batch.');
      var total = 0;
      var images = p.images.map(function(image) {
        if (!image || !validKey(image.key) || ![image.row,image.column,image.width,image.height].every(Number.isInteger) ||
            image.row < 2 || image.row > sheet.getMaxRows() || ![3,6,7].includes(image.column) || image.width < 1 ||
            image.height < 1 || image.width > 1000 || image.height > 500 ||
            typeof image.base64 !== 'string' || image.base64.length > 2800000 ||
            !/^[A-Za-z0-9+/]+={0,2}$/.test(image.base64)) throw Error('Invalid image.');
        var bytes = Utilities.base64Decode(image.base64);
        total += bytes.length;
        if (bytes.length > 2*1024*1024 || [137,80,78,71,13,10,26,10].some(function(byte,i) {return (bytes[i]&255)!==byte;})) {
          throw Error('Invalid PNG.');
        }
        return {image:image,bytes:bytes};
      });
      if (total > 3500000) throw Error('Image batch exceeds permitted size.');
      images.forEach(function(item) {
        var image = item.image, title = 'enlighten-'+image.key;
        if (titles.has(title)) return;
        sheet.insertImage(Utilities.newBlob(item.bytes,'image/png',image.key+'.png'),image.column,image.row,6,6)
          .setAltTextTitle(title).setWidth(image.width).setHeight(image.height);
        titles.add(title);
      });
      SpreadsheetApp.flush();
      return output({ok:true,data:{inserted:images.length}});
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return output({ok:false});
  }
}
function insidePreviewRoot(file,root) {
  var queue = [file], visited = new Set();
  while (queue.length && visited.size < 100) {
    var item = queue.shift(), id = item.getId();
    if (id === root) return true;
    if (visited.has(id) || item.isTrashed()) continue;
    visited.add(id);
    var parents = item.getParents();
    while (parents.hasNext() && queue.length < 100) queue.push(parents.next());
  }
  return false;
}
function output(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
