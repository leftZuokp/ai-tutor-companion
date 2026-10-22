import type { SeedNode } from "./types";

/** 九年级主卷：一元二次方程（二次函数、相似、圆、概率见 g9-extra） */
export const G9_NODES: SeedNode[] = [
  {
    id: "math_g9_quadratic",
    title: "一元二次方程",
    grade: 9,
    chapter: "第二十一章 一元二次方程",
    sortOrder: 11,
    prerequisites: ["math_g8_factorization"],
    thinkingMethods: ["化归思想", "分类讨论"],
    card: {
      premise: "一般形式 $ax^2+bx+c=0$（$a\\ne0$）；判别式 $\\Delta=b^2-4ac$ 决定根的个数；求根公式 $x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$（$\\Delta\\ge0$）。",
      positive: "$x^2-3x+2=0$ 因式分解为 $(x-1)(x-2)=0$，得 $x_1=1$，$x_2=2$。",
      negative: "$\\Delta<0$ 时仍套求根公式得出“实数根”是错的——负数不能开平方，方程无实根。",
      errors: "忘记 $a\\ne0$ 的前提；因式分解法丢根（除以含未知数的因式）；判别式符号算错；应用题解出的根未检验实际意义。",
    },
    questions: [
      {
        id: "math_g9_quadratic_q1",
        type: "single_choice",
        content: "方程 $x^2-4=0$ 的解为（　）",
        options: ["$x=\\pm2$", "$x=2$", "$x=-2$", "$x=4$"],
        answer: "A",
        explanation: "移项：$x^2=4$，直接开平方：$x=\\pm\\sqrt{4}=\\pm2$。注意正负两解都不能丢。",
        difficulty: 1,
        dimension: "concept",
      },
      {
        id: "math_g9_quadratic_q2",
        type: "single_choice",
        content: "方程 $x^2-3x+2=0$ 的解为（　）",
        options: ["$x_1=1,\\ x_2=2$", "$x_1=-1,\\ x_2=-2$", "$x_1=1,\\ x_2=-2$", "$x=3$"],
        answer: "A",
        explanation: "因式分解：$(x-1)(x-2)=0$，所以 $x-1=0$ 或 $x-2=0$，得 $x_1=1$，$x_2=2$。",
        difficulty: 1,
        dimension: "calc",
      },
      {
        id: "math_g9_quadratic_q3",
        type: "single_choice",
        content: "用公式法解方程 $x^2-2x-1=0$，正确的结果是（　）",
        options: ["$x=1\\pm\\sqrt{2}$", "$x=-1\\pm\\sqrt{2}$", "$x=1\\pm\\sqrt{6}$", "$x=2\\pm\\sqrt{2}$"],
        answer: "A",
        explanation:
          "求根公式 $x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$。这里 $a=1,b=-2,c=-1$，判别式 $\\Delta=(-2)^2-4\\times1\\times(-1)=8$，$x=\\frac{2\\pm\\sqrt{8}}{2}=\\frac{2\\pm2\\sqrt{2}}{2}=1\\pm\\sqrt{2}$。",
        difficulty: 2,
        dimension: "calc",
        hints: ["先确认 $a$、$b$、$c$（注意符号），再算判别式 $\\Delta$。", "$\\Delta=(-2)^2-4\times1\times(-1)=8$，代入 $x=\frac{2\pm\sqrt{8}}{2}$ 化简。"],
      },
      {
        id: "math_g9_quadratic_q4",
        type: "single_choice",
        content: "若关于 $x$ 的方程 $x^2+2x+c=0$ 有两个相等的实数根，则 $c=$ （　）",
        options: ["$1$", "$-1$", "$2$", "$0$"],
        answer: "A",
        explanation: "两根相等 $\\Leftrightarrow$ 判别式 $\\Delta=0$：$\\Delta=2^2-4\\times1\\times c=4-4c=0$，解得 $c=1$。",
        difficulty: 2,
        dimension: "concept",
        hints: ["“两个相等的实数根”等价于判别式满足什么条件？", "$\Delta=4-4c=0$，解出 $c$。"],
      },
      {
        id: "math_g9_quadratic_q5",
        type: "fill_in",
        content: "某商品原价 $100$ 元，连续两次降价后为 $81$ 元，则平均每次降价的百分率为 ______%（填数字）",
        answer: "10",
        explanation:
          "设平均每次降价百分率为 $x$，则 $100(1-x)^2=81$，即 $(1-x)^2=0.81$，$1-x=\\pm0.9$。舍去负根（降价率不能超过 $100\\%$，需检验实际意义），得 $x=0.1=10\\%$。",
        difficulty: 3,
        dimension: "application",
        hints: ["设降价率为 $x$，“连续两次降价后”的价格怎么表示？", "$100(1-x)^2=81$，开平方后注意舍去不合实际的根。"],
      },
    ],
  },
];
