export function* random(
  totalCharacters: number,
): Generator<string, void, unknown> {
  let remaining = totalCharacters

  while (remaining > 0) {
    const chunkSize = Math.floor(Math.random() * Math.min(remaining, 10)) + 1
    let chunk = ""

    for (let i = 0; i < chunkSize; i++) {
      const charCode = Math.floor(Math.random() * 26) + 97 // a-z
      chunk += String.fromCharCode(charCode)
    }

    yield chunk
    remaining -= chunkSize
  }
}
