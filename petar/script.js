// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.messenger.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

var incomingMessageBubbleClass = "_3oh-";

var outputMessageTransformer = function(input) {
    return input.toUpperCase();
}

var inputMessageTransformer = function(input) {
  return ">> " + input + " <<";
}

if (!Object.prototype.watch) {
  Object.defineProperty(Object.prototype, "watch", {
      enumerable: false
    , configurable: true
    , writable: false
    , value: function (prop, handler) {
      var
        oldval = this[prop]
      , newval = oldval
      , getter = function () {
        return newval;
      }
      , setter = function (val) {
        oldval = newval;
        return newval = handler.call(this, prop, oldval, val);
      }
      ;

      if (delete this[prop]) { // can't watch constants
        Object.defineProperty(this, prop, {
            get: getter
          , set: setter
          , enumerable: true
          , configurable: true
        });
      }
    }
  });
}

// object.unwatch
if (!Object.prototype.unwatch) {
  Object.defineProperty(Object.prototype, "unwatch", {
      enumerable: false
    , configurable: true
    , writable: false
    , value: function (prop) {
      var val = this[prop];
      delete this[prop]; // remove accessors
      this[prop] = val;
    }
  });
}

//------

console.log("Adding PGP support!");

var a =  null;

window.watch("__d", function(id, oldVal, newVal) {
  return function(sa, ta, ua, va) {
    if(sa == 'MessengerComposerInput.react') {
      var oldUa = ua;
      var newUa = function(b, c, d, e, f, g, h, i) {
        var oldC = c;
        // Patch the factory function
        c = function(name) {
          var thing = oldC(name);
          var oldClassCreator = thing.createClass;

          // Patch the create class method so we can modify object maps on the fly
          thing.createClass = function(obj) {
            // Replace the getValue property if it is present
            if(obj['displayName'] === "MessengerInput" && obj.hasOwnProperty('getValue')) {
              if (!(obj._originals && obj._originals.getValue)) {
                obj._originals = {};
                obj._originals.getValue = obj.getValue;
                obj.getValue = function() {
                  return outputMessageTransformer(this._originals.getValue.bind(this)());
                };
              }
            }
            return oldClassCreator(obj);
          };
          
          // Patch the createElement method so that we can change element renderings on the fly
          if(name === 'React') {
            var oldElementCreator = thing.createElement;
            if(oldElementCreator && oldElementCreator.length == 3) {
              console.log("Changing render method on ");
              console.log(thing);
              console.log(thing.createElement.length);
              thing.createElement = function() {
                if(arguments.length > 1) {
                  var elementArgs = arguments[1];
                  if(elementArgs && elementArgs.hasOwnProperty('className') && elementArgs['className'] == incomingMessageBubbleClass && elementArgs.body) {
                    elementArgs.body = inputMessageTransformer(elementArgs.body);
                  }
                }
                
                return oldElementCreator.apply(this, arguments);
              }
            }
          }
          
          return thing;
        };
        return oldUa(b, c, d, e, f, g, h, i);
      };
      ua = newUa;
    }
    newVal(sa, ta, ua, va);
  };
});
