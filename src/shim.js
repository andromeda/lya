// Lya shares the same globals as the code it analyzes.  This makes it
// vulnerable to breakage. Bind any APIs needed.

module.exports = {
  ObjectAssign: Object.assign.bind(Object),
  ObjectDefineProperty: Object.defineProperty.bind(Object),
  ObjectGetOwnPropertyNames: Object.getOwnPropertyNames.bind(Object),
  ObjectGetOwnPropertyDescriptor: Object.getOwnPropertyDescriptor.bind(Object),
  ObjectKeys: Object.keys.bind(Object),
};
