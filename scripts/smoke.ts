// 盤面生成器 + 評価器のスモークテスト
// 実行: npx tsx scripts/smoke.ts
import { generateBoard } from '../src/game/generator';
import { evaluate } from '../src/game/evaluator';

const RUNS = 200;
let success = 0;
let fail = 0;
let solvableButNotSolved = 0;
const failures: string[] = [];

for (let i = 0; i < RUNS; i++) {
  try {
    const colors = i < 80 ? ['red', 'blue'] : i < 160 ? ['red', 'blue', 'yellow'] : ['red', 'blue', 'yellow', 'green'];
    const { board, solutionRotations } = generateBoard({
      cols: 6,
      rows: 9,
      colors: colors as any,
      pairsPerColor: 1,
      noiseDensity: 0.3,
      seed: i * 991 + 1,
    });

    // 初期状態は INCOMPLETE/INVALID であるはず (rotation を乱しているので)
    const initial = evaluate(board);

    // 解状態にして CLEAR を確認
    const solvedCells = board.cells.map((c, k) => ({
      ...c,
      rotation: c.type === 'empty' ? 0 : solutionRotations[k],
    }));
    const solved = evaluate({ ...board, cells: solvedCells });

    if (solved.status === 'CLEAR') {
      success++;
      if (initial.status === 'CLEAR') {
        // 初期状態がすでに正解だった (たまたま) → 警告
        // 0回回転で解けるパズルは不適切
        solvableButNotSolved++;
      }
    } else {
      fail++;
      failures.push(`#${i} colors=${colors} -> solved status=${solved.status}`);
    }
  } catch (e) {
    fail++;
    failures.push(`#${i} EXCEPTION: ${(e as Error).message}`);
  }
}

console.log('='.repeat(48));
console.log(`SMOKE TEST RESULT (runs = ${RUNS})`);
console.log(`  success            : ${success}`);
console.log(`  fail               : ${fail}`);
console.log(`  initial-was-clear  : ${solvableButNotSolved}`);
if (failures.length > 0) {
  console.log('---- FAILURES (first 5) ----');
  for (const f of failures.slice(0, 5)) console.log('  ' + f);
}
console.log('='.repeat(48));
process.exit(fail === 0 ? 0 : 1);
