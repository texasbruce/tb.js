/*Utilities*/
/** each (collection, callback, allowsingle)
 ** collection can be single element (only if allowsingle is set to true), array, any list, or a hashmap (only if allowsingle is not set)
 ** return undefined
 **/
each = function (cl, fn, allowsingle) {
  if (cl.length) {
    for (var i = 0; i < cl.length; i++) {
      (function (_el,_i) {
       fn(_el, i);
       })(cl[i], i);
    }
  }
  else if (!allowsingle){
    for (var k in cl) {
      (function(_k, _v) {
       fn(_k, _v);
       })(k, cl[k]);
    }
  }
  else {
    fn (cl, 0);
  }
};

/** map (collection, callback, allowsingle)
 ** collection can be single element (only if allowsingle is set to true), array, any list, or a hashmap (only if allowsingle is not set)
 ** return single element if collection is single element, array if collection is not single element
 **/
map = function (cl, fn, allowsingle) {
  var result = [];
  if (cl.length) {
    for (var i = 0; i < cl.length; i++) {
      (function (_el,_i, _result) {
       _result.push(fn(_el, i));
       })(cl[i], i, result);
    }
  }
  else if (!allowsingle) {
    for (var k in cl) {
      (function(_k, _v, _result) {
       _result.push(fn(_k, _v));
       })(k, cl[k], result);
    }
  }
  else {
    result = fn(cl, 0);
  }
  return result;
};


/** chain (target, function, ...)
 ** chain operations on the target
 **/
chain = function() {
  for(var i = 1; i < arguments.length; i++) {
    (function(obj, fn) {
     fn(obj);
     })(arguments[0], arguments[i]);
  }
};


/* DOM Handling */
/** $ is the namespace for all DOM operation functions
 ** itself is also a function using CSS Selector to query elements
 ** return nodelist
 **/
$ = function(sel) {
  return document.querySelectorAll(sel);
};

/** Generate Function Stubs in namespace
 ** all - Get all matching elements which are descents of the first argument(CSS Selector applies) (IE8+)
 ** function (element = document, selectorString) return a nodelist;
 **
 ** one - Get first matching element (like all but only get first one; fast) (IE8+)
 ** function (element = document, selectorString) 
 ** return a node;
 **
 ** id - Get element by ID
 ** function (element = document, idWithoutPrefix#) i
 ** This utilizes getElementById function which is the fastest query function available
 ** return a node;
 **/
(function(ns) {
  var queryFunctionMapping = {
    'all':'querySelectorAll',
    'one':'querySelector',
    'id':'getElementById',
  };
 
  each(queryFunctionMapping, function(n, fnn) {
    ns[n] = function (el, s) {
      return (!s) ? document[fnn](el) : el[fnn](s);
    };
  });
 
  /** When DOM element is ready (IE9+)
   ** ready(element=document, callback)
   **/
  ns.ready = function (el, fn) {
    var en = "DOMContentLoaded";
    (!fn) ?  ns.on (document, en, el): each(el, function(em) {ns.on (em, en, fn);}, true);
  };

  /** create ([parentElement,] elementType);
   ** Create a DOM element and append to element
   ** if element is not provided, it just creates an unattached element
   ** return the new created element
   **/ 
  ns.create = function (parentElement, elementType) {
    if (elementType) {
      var element = document.createElement(elementType);
      parentElement.appendChild(element);
      return element;
    }
    else {
      return document.createElement(parentElement);
    }
  }

  var setFunctionMapping = {
    'attr': function(el,k,v) { return v ? el.setAttribute(k,v) : el.getAttribute(k);},
    'css' : function(el,k,v) { return v ? el.style[k] = v : el.style[k];},
    'prop': function(el,k,v) { return v ? el[k] = v : el[k];}
  };
 
  each(setFunctionMapping, function(n, fn) {
    ns[n] = function (el, k, v) {
      return map (el, function (em) { return fn(em,k); }, true);
    };
  });

  /** Attach event
   ** on(element, eventName, callback, isCaptureBubbling)
   ** isCaptureBubbling not working in IE
   **/
  ns.on = function(el, en, fn, cap) {
    (document.addEventListener) ? 
      each(el, function (em) { em.addEventListener(en, fn, cap); }, true) :
      each(el, function (em) { em.attachEvent("on"+en, fn); }, true);
  };

  /** Send AJAX request to server
   ** ajax(url, data, [usePost], successCallback, [errorCallback, progressCallback])
   ** url: string
   ** data: string or object; if it is object, it should be as following:
   **   {text: dataString, mimetype : mimetypestring, otherheader : otherheadervalue, ...}
   ** userPost [optional]: use "POST" if true, use "GET" if false or not given
   ** successCallback: function (response, statusCode)
   ** errorCallback: function (response, statusCode)
   ** progressCallback : function (response)
   **/
  ns.ajax = function(url, data, usePost, fnSuc, fnErr, fnProg) {
    if (!fnSuc) {
      fnSuc = usePost;
    }
    else if (!fnErr) && typeof(usePost) == "function") {
      fnErr = fnSuc;
      fnSuc = usePost;
    }
    
    var req = new XMLHttpRequest();
    req.open((usePost ? "POST" : "GET"), url, true);

    var prop = {}, text = data;
    if (typeof(data) != "string") {
      text = data.text;
      delete data.text;
      prop = data;
    }
    each (prop, function (k,v) {
      if (k != "mimetype") {
        req.setRequestHeader(k,v);
      }
      else {
        req.overrideMimeType();
      }
    });

    req.onreadystatechange = function () {
      if(req.readystate == 3 && fnProg) {
        fnProg(req.response);
      }
      else (req.readystate == 4) {
        if (req.status == 200 || req.status == 304) {
          fnSuc(req.response, req.status);
        }
        else if(fnErr) {
          fnErr(req.response, req.status);
        }
      }
    }

    req.send(text);
  };
    

})($);

