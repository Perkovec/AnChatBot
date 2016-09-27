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
        text = `был(а) ${minutes} мин. назад`;
      } else {
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
          text = `был(а) ${hours} ч. назад`
        } else {
          text = `был(а) ${Math.floor(hours / 24)} д. назад`
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

  static truncate(text, n, useWordBoundary) {
    const isTooLong = text.length > n;
    let s_ = isTooLong ? text.substr(0, n - 1) : text;
    s_ = (useWordBoundary && isTooLong) ? s_.substr(0, s_.lastIndexOf(' ')) : s_;
    return  isTooLong ? s_ + '…' : s_;
  }

  static cutLines(text, lineCount) {
    if (lineCount < 1) return text;
    const lines = text.split('\n');
    lines.splice(0, lineCount);
    return lines.join('\n');
  }

  static escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }
}

module.exports = Util;
