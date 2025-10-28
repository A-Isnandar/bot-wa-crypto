// utils/formatters.js

// Fungsi helper buat format angka jadi mata uang (Versi Perbaikan Desimal Super Kecil)
function formatCurrency(value, currencyCode) {
  const lowerCurrencyCode = currencyCode.toLowerCase();

  // Handling Angka Nol
  if (value === 0) {
    if (lowerCurrencyCode === 'idr') return 'Rp 0';
    if (lowerCurrencyCode === 'usd') return '$0.00';
    return '0';
  }

  // Handling Angka SANGAT KECIL (di bawah threshold normal)
  const isVerySmall =
    value > 0 && value < (lowerCurrencyCode === 'idr' ? 1 : 0.01);

  if (isVerySmall) {
    let prefix = '';
    if (lowerCurrencyCode === 'usd') prefix = '$';
    else if (lowerCurrencyCode === 'idr') prefix = 'Rp '; // Pake spasi

    try {
      // --- LOGIKA BARU UNTUK ANGKA KECIL ---
      // Paksa tampilkan minimal 10 digit desimal, atau lebih jika perlu
      // Cari jumlah 0 di depan setelah koma
      const stringValue = value.toString();
      let decimalsToShow = 10; // Minimal 10 desimal

      if (stringValue.includes('.')) {
        const decimalPart = stringValue.split('.')[1];
        const leadingZerosMatch = decimalPart.match(/^0*/);
        const leadingZeros = leadingZerosMatch
          ? leadingZerosMatch[0].length
          : 0;
        // Tampilkan minimal 4 angka signifikan setelah 0
        decimalsToShow = Math.max(10, leadingZeros + 4);
      }

      // Gunakan toFixed() dengan jumlah desimal yang dihitung
      let formattedValue = value.toFixed(decimalsToShow);

      // Hapus trailing zeros yang tidak perlu JIKA BUKAN USD/IDR
      // if (!['usd', 'idr'].includes(lowerCurrencyCode)) {
      //     formattedValue = parseFloat(formattedValue).toString();
      // }
      // Kita biarkan saja trailing zero biar konsisten 10 desimal minimal

      return prefix + formattedValue;
      // --- AKHIR LOGIKA BARU ---
    } catch (e) {
      console.error('Error formatting small currency:', e);
      // Fallback paling aman kalo toFixed error (jarang)
      return prefix + value.toPrecision(8); // Coba toPrecision
    }
  } else {
    // --- LOGIKA LAMA UNTUK ANGKA NORMAL ---
    let options = {
      maximumFractionDigits: 6,
      minimumFractionDigits: 2,
    };

    if (['usd', 'idr', 'eur', 'gbp', 'jpy'].includes(lowerCurrencyCode)) {
      options.style = 'currency';
      options.currency = currencyCode.toUpperCase();
      if (lowerCurrencyCode === 'idr') {
        options.minimumFractionDigits = 0;
        options.maximumFractionDigits = 0;
      } else {
        options.minimumFractionDigits = 2;
        options.maximumFractionDigits = 2;
      }
    } else {
      // Untuk crypto (di atas $0.01), tampilkan 8 desimal
      options.maximumFractionDigits = 8;
    }

    try {
      // Gunakan Intl.NumberFormat untuk angka normal
      return new Intl.NumberFormat(
        lowerCurrencyCode === 'idr' ? 'id-ID' : 'en-US',
        options
      ).format(value);
    } catch (e) {
      console.error('Error formatting normal currency:', e);
      // Fallback
      return value.toFixed(6);
    }
  }
}

module.exports = {
  formatCurrency,
};
