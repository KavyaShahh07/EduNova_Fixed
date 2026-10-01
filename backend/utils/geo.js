const geoip = require('geoip-lite');

/**
 * Converts a 2-letter ISO country code into an emoji flag
 * e.g. 'US' -> '🇺🇸', 'IN' -> '🇮🇳'
 */
const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode.length !== 2 || countryCode === 'LOCAL') {
    return '🏠';
  }
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
};

/**
 * Common country code to name mapping
 */
const countryNames = {
  US: 'United States',
  IN: 'India',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
  SG: 'Singapore',
  AE: 'United Arab Emirates',
  BR: 'Brazil',
  ZA: 'South Africa',
  NL: 'Netherlands',
  LOCAL: 'Local Network',
};

/**
 * Checks if an IP is private/loopback/bogon
 */
const isPrivateIp = (ip) => {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, '').trim();
  if (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === 'localhost' ||
    clean.startsWith('10.') ||
    clean.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean) ||
    clean.startsWith('fe80:') ||
    clean.startsWith('fc00:')
  ) {
    return true;
  }
  return false;
};

/**
 * Cleans IP string by removing IPv4-mapped IPv6 prefix and port if present
 */
const cleanIpAddress = (rawIp) => {
  if (!rawIp) return '';
  let ip = rawIp.trim();
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  // Remove port if present (e.g. 192.168.1.1:5000)
  if (ip.includes(':') && ip.split(':').length === 2 && !ip.includes('[')) {
    ip = ip.split(':')[0];
  }
  return ip;
};

/**
 * Resolves geolocation for an IP address
 * @param {string} rawIp
 * @returns {object} { country, countryName, city, region, flag, isPrivate, formatted }
 */
const resolveIpLocation = (rawIp) => {
  const ip = cleanIpAddress(rawIp);

  if (!ip || isPrivateIp(ip)) {
    return {
      ip: ip || '127.0.0.1',
      country: 'LOCAL',
      countryName: 'Localhost / Internal LAN',
      city: 'Local Network',
      region: 'LAN',
      flag: '🏠',
      isPrivate: true,
      formatted: '🏠 Local Network (127.0.0.1)',
    };
  }

  const lookup = geoip.lookup(ip);
  if (!lookup) {
    return {
      ip,
      country: 'UNKNOWN',
      countryName: 'Unknown Country',
      city: '',
      region: '',
      flag: '🌐',
      isPrivate: false,
      formatted: `🌐 Unknown Location (${ip})`,
    };
  }

  const country = lookup.country || 'UNKNOWN';
  const countryName = countryNames[country] || country;
  const city = lookup.city || '';
  const region = lookup.region || '';
  const flag = getCountryFlag(country);

  let formatted = `${flag} `;
  if (city) formatted += `${city}, `;
  formatted += countryName;

  return {
    ip,
    country,
    countryName,
    city,
    region,
    ll: lookup.ll || null,
    flag,
    isPrivate: false,
    formatted,
  };
};

module.exports = {
  resolveIpLocation,
  getCountryFlag,
  cleanIpAddress,
  isPrivateIp,
};
