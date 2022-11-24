{
  let n = parseInt(prompt("n", "0") ?? "0", 10);
  if (n > 0) {
    let result = n.toString(16);
    let { log2, ceil, pow } = Math;
    let digits = pow(2, ceil(log2(result.length)));
    prompt(`hex(${n}) = `, "0x" + result.padStart(digits, "0"));
  }
}
