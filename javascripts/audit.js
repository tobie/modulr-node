function audit(raw) {
  function getId(obj) { return obj.id; }
  function wasEvaled(obj) { return obj.evalStart; }
  function wasRequired(obj) { return obj.count; }
  function not(fn) {
    return function() { return !fn.apply(null, arguments); };
  }
  
  function makeWrapper(tag) {
    return function(str) {
      return '<' + tag + '>' + str + '</' + tag + '>';
    } 
  }

  var modules = Object.keys(raw.modules).map(function(id) {
    var m = raw.modules[id];
    m.id = id;
    return m;
  });
  
  var html = '',
      unrequired = modules.filter(not(wasRequired)).map(getId).sort();
      evaled = modules.filter(wasEvaled).map(getId).sort();
  
  if (unrequired.length) {
    html += "<p>" + unrequired.length + " modules were not required during initialization and should probably be lazy evaluated:</p>";
    html += "<ul>" + unrequired.map(makeWrapper('li')).join('') + "</ul>";
  }
  if (evaled.length) {
    html += "<p>" + evaled.length + " modules were lazy evaluated, but were required during initialization. They probably should not be lazy evaluated:</p>";
    html += "<ul>" + evaled.map(makeWrapper('li')).join('') + "</ul>";
  }

  html += "<hr />";
  return html;
}