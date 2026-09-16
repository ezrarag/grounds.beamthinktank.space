/**
 * Extracts GPS latitude and longitude from JPEG EXIF metadata in an ArrayBuffer.
 * Returns { lat, lng } if EXIF GPS metadata is present, or null if not found/invalid.
 */
export function parseExifLocation(buffer: ArrayBuffer): { lat: number; lng: number } | null {
  try {
    const view = new DataView(buffer)
    // Check for JPEG SOI (0xFFD8)
    if (view.getUint16(0, false) !== 0xffd8) return null

    let offset = 2
    const length = view.byteLength

    while (offset < length - 2) {
      const marker = view.getUint16(offset, false)
      offset += 2

      if (marker === 0xffe1) { // APP1 Marker
        const app1Length = view.getUint16(offset, false)
        offset += 2

        // Verify "Exif\0\0"
        if (
          view.getUint8(offset) === 0x45 &&
          view.getUint8(offset + 1) === 0x78 &&
          view.getUint8(offset + 2) === 0x69 &&
          view.getUint8(offset + 3) === 0x66 &&
          view.getUint8(offset + 4) === 0x00 &&
          view.getUint8(offset + 5) === 0x00
        ) {
          const tiffOffset = offset + 6
          const littleEndian = view.getUint16(tiffOffset, false) === 0x4949
          const firstIfdOffset = view.getUint32(tiffOffset + 4, littleEndian)
          let ifdOffset = tiffOffset + firstIfdOffset

          if (ifdOffset >= length) return null

          const numEntries = view.getUint16(ifdOffset, littleEndian)
          ifdOffset += 2

          let gpsInfoOffset = 0
          for (let i = 0; i < numEntries; i++) {
            const entryOffset = ifdOffset + i * 12
            if (entryOffset + 12 > length) break
            const tag = view.getUint16(entryOffset, littleEndian)
            if (tag === 0x8825) { // GPSInfo tag
              gpsInfoOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian)
              break
            }
          }

          if (gpsInfoOffset && gpsInfoOffset + 2 < length) {
            const gpsEntries = view.getUint16(gpsInfoOffset, littleEndian)
            gpsInfoOffset += 2
            let latDeg: number[] = []
            let lngDeg: number[] = []
            let latRef = 'N'
            let lngRef = 'W'

            for (let i = 0; i < gpsEntries; i++) {
              const entryOffset = gpsInfoOffset + i * 12
              if (entryOffset + 12 > length) break
              const tag = view.getUint16(entryOffset, littleEndian)
              const valOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian)

              if (tag === 1) { // GPSLatitudeRef
                latRef = String.fromCharCode(view.getUint8(entryOffset + 8))
              } else if (tag === 2 && valOffset + 24 <= length) { // GPSLatitude
                latDeg = [
                  view.getUint32(valOffset, littleEndian) / (view.getUint32(valOffset + 4, littleEndian) || 1),
                  view.getUint32(valOffset + 8, littleEndian) / (view.getUint32(valOffset + 12, littleEndian) || 1),
                  view.getUint32(valOffset + 16, littleEndian) / (view.getUint32(valOffset + 20, littleEndian) || 1),
                ]
              } else if (tag === 3) { // GPSLongitudeRef
                lngRef = String.fromCharCode(view.getUint8(entryOffset + 8))
              } else if (tag === 4 && valOffset + 24 <= length) { // GPSLongitude
                lngDeg = [
                  view.getUint32(valOffset, littleEndian) / (view.getUint32(valOffset + 4, littleEndian) || 1),
                  view.getUint32(valOffset + 8, littleEndian) / (view.getUint32(valOffset + 12, littleEndian) || 1),
                  view.getUint32(valOffset + 16, littleEndian) / (view.getUint32(valOffset + 20, littleEndian) || 1),
                ]
              }
            }

            if (latDeg.length === 3 && lngDeg.length === 3) {
              let lat = latDeg[0] + latDeg[1] / 60 + latDeg[2] / 3600
              let lng = lngDeg[0] + lngDeg[1] / 60 + lngDeg[2] / 3600
              if (latRef === 'S') lat = -lat
              if (lngRef === 'W') lng = -lng
              return { lat, lng }
            }
          }
        }
      } else if ((marker & 0xff00) === 0xff00) {
        if (marker === 0xffda) break // SOS (Start of Scan) marker
        const segmentLength = view.getUint16(offset, false)
        offset += segmentLength
      } else {
        break
      }
    }
  } catch {
    // Fail silently on non-standard binary headers
  }
  return null
}
