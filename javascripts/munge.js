(function(exports) {
  function getRoots(obj) {
    var node = obj[1], output = [];
    while(node) {
      output.push(node);
      node = obj[node.right + 1];
    }
    return output;
  }

  function isLeaf(node) {
    return node.left + 1 === node.right;
  }

  function getChildren(root, context) {
    var i = root.left + 1,
        output = [];
    while (i < root.right) {
      if (context[i]) {
        output.push(context[i])
      }
      i++;
    }
    return output;
  }
  
  function munge(input) {
    var modules = {};
    Object.keys(input.modules).forEach(function(id) {
      var m = input.modules[id];
      m.id = id;
      modules[m.left] = m;
    });
    
    var t0 = modules[1].start,
        output = []

    getRoots(modules).forEach(function(root) {
      var arr = getChildren(root, modules);
      arr.unshift(root);

      function iterate(arr) {
        var root = arr.shift();
        var times = [];
        times.node = root;
        if (isLeaf(root)) {
          times.push([root.start - t0, root.end - t0])
          return times;
        }

        var max = root.start - t0;
        arr.forEach(function(n) {
          if (n.left > root.right) {
            return; // not a child
          }
          var start = n.start - t0;
          if (start >= max) {
            times.push([max, start]);
            max = n.end - t0;
          }
        });
        times.push([max, root.end - t0])
        return times;
      }

      var a = arr.slice(0);
      while (a.length) {
        output.push(iterate(a))
      }
    });
    
    return output;
  }
  
  exports.mungeData = munge;
})(this);