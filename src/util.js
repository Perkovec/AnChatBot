class Util {
  static format(str, args) {
    let ret = str;
    for (let i in args) {
      ret = ret.replace('{'+i+'}', args[i]);
    }
    return ret;
  }

  static numberToLetter(num) {
    let ret, a, b;
    for (ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
      ret = String.fromCharCode(parseInt((num % b) / a) + 65) + ret;
    }
    return ret;
  }

  static letterToNumber(val) {
    const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let i, j, result = 0;
    for (i = 0, j = val.length - 1; i < val.length; i += 1, j -= 1) {
      result += Math.pow(base.length, j) * (base.indexOf(val[i]) + 1);
    }
    return result;
  }
}

module.exports = Util;
