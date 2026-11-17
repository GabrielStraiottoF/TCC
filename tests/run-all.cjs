// Executa todos os testes de tests/*.cjs em sequência e resume o resultado.
// Uso: npm test   (ou: node tests/run-all.cjs [filtro])
// Os testes de navegador precisam de Playwright + Chromium; os demais rodam só com Node.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const filter = process.argv[2];
const files = fs.readdirSync(__dirname)
    .filter(f => f.endsWith(".cjs") && f !== path.basename(__filename))
    .filter(f => !filter || f.includes(filter))
    .sort();

let failures = 0;
const summary = [];
for (const file of files) {
    console.log(`\n=== ${file}`);
    const result = spawnSync(process.execPath, [path.join(__dirname, file)], { encoding: "utf8", timeout: 240000 });
    const output = `${result.stdout || ""}${result.stderr || ""}`;
    process.stdout.write(output);
    const match = output.match(/Resultado: (\d+) aprovado\(s\), (\d+) reprovado\(s\)/);
    const ok = result.status === 0 && match && Number(match[2]) === 0;
    if (!ok) failures++;
    summary.push(`${ok ? "OK  " : "FAIL"} ${file}${match ? ` (${match[1]} aprovados, ${match[2]} reprovados)` : " (sem resumo)"}`);
}
console.log("\n--- Resumo ---");
summary.forEach(line => console.log(line));
process.exit(failures === 0 ? 0 : 1);
