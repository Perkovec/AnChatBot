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

  static UTCTime() {
    return Math.floor(Date.now() / 1000);
  }

  static timeDiff2Text(diff) {
    let text = '';

    if (diff <= 3 * 60) {
      text = 'онлайн';
    } else {
      const minutes = Math.floor(diff / 60);
      if (minutes < 60) {
        text = `был ${minutes} мин. назад`;
      } else {
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
          text = `был ${hours} ч. назад`
        } else {
          text = `был ${Math.floor(hours / 24)} д. назад`
        }
      }
    }

    return text;
  }

  static sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }
}

module.exports = Util;
