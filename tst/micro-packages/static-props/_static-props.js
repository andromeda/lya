/**
 * @param {Object} obj
 * @returns {Function}
 */
function staticProps (obj) {
  /**
   * @param {Object} props
   * @param {Boolean} [enumerable]
   */
  return function (props, enumerable) {
    var staticProps = {}

    for (var propName in props) {
      var staticProp = {
        configurable: false,
        enumerable: enumerable
      }

      var prop = props[propName]

      if (typeof prop === 'function') {
        staticProp.get = prop
      } else {
        staticProp.value = prop

        staticProp.writable = false
      }

      staticProps[propName] = staticProp
    }

    Object.defineProperties(obj, staticProps)
  }
}
module.exports = exports.default = staticProps
