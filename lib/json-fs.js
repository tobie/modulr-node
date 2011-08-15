var fs = require('fs');

exports.readFile = readFile;
function readFile(file, callback) {
  fs.readFile(file, 'utf8', function(err, data) {
    if (err) {
      callback(err);
    } else {
      try {
        data = JSON.parse(data);
        callback(null, data);
      } catch(err) {
        callback(err);
      }
    }
  });
}