class Util {
  static format(str, args) {
    let ret = str;
    for (let i in args) {
      ret = ret.replace('{'+i+'}', args[i]);
    }
    return ret;
  }
}

module.exports = Util;
