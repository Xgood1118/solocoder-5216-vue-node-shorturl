function isIpV4(str) {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(str)
}

function ipv4ToNum(ip) {
  return ip.split('.').reduce((acc, octet, i) => {
    return acc + (parseInt(octet, 10) << (24 - i * 8))
  }, 0) >>> 0
}

function inRange(ip, start, end) {
  const ipNum = ipv4ToNum(ip)
  return ipNum >= ipv4ToNum(start) && ipNum <= ipv4ToNum(end)
}

const PRIVATE_RANGES = [
  ['10.0.0.0', '10.255.255.255'],
  ['172.16.0.0', '172.31.255.255'],
  ['192.168.0.0', '192.168.255.255'],
  ['127.0.0.0', '127.255.255.255'],
  ['0.0.0.0', '0.255.255.255'],
  ['169.254.0.0', '169.254.255.255']
]

export function isPrivate(hostname) {
  if (!isIpV4(hostname)) return false

  for (const [start, end] of PRIVATE_RANGES) {
    if (inRange(hostname, start, end)) {
      return true
    }
  }

  return false
}
