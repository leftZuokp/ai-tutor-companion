/**
 * 种子数据：数学题库（G7~G9，11 个知识点，55 道题）
 * 幂等设计：知识点与题目均使用稳定 ID，可重复执行。
 */
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

interface SeedQuestion {
  id: string;
  type: "single_choice" | "fill_in";
  content: string;
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: 1 | 2 | 3;
}

interface SeedNode {
  id: string;
  title: string;
  grade: number;
  chapter: string;
  sortOrder: number;
  questions: SeedQuestion[];
}

const NODES: SeedNode[] = [
  {
    id: "math_g7_rational_number_line",
    title: "正负数、数轴与绝对值",
    grade: 7,
    chapter: "第一章 有理数",
    sortOrder: 1,
    questions: [
      {
        id: "math_g7_rational_number_line_q1",
        type: "single_choice",
        content: "$|-5|=$ ？",
        options: ["$-5$", "$5$", "$-\\frac{1}{5}$", "$\\frac{1}{5}$"],
        answer: "B",
        explanation:
          "绝对值的几何意义：数轴上表示 $-5$ 的点到原点的距离为 $5$，故 $|-5|=5$。注意：绝对值结果是非负数，排除 $-5$。",
        difficulty: 1,
      },
      {
        id: "math_g7_rational_number_line_q2",
        type: "single_choice",
        content: "数轴上表示 $-2$ 的点与表示 $3$ 的点之间的距离是（　）",
        options: ["$1$", "$2$", "$5$", "$6$"],
        answer: "C",
        explanation:
          "数轴上两点距离 $=|3-(-2)|=|5|=5$。也可以数格子：从 $-2$ 到 $3$ 共跨过 $5$ 个单位长度。",
        difficulty: 2,
      },
      {
        id: "math_g7_rational_number_line_q3",
        type: "single_choice",
        content: "比较 $-0.5$、$-\\frac{1}{3}$、$0$ 的大小，其中最小的是（　）",
        options: ["$-0.5$", "$-\\frac{1}{3}$", "$0$", "无法比较"],
        answer: "A",
        explanation:
          "负数比较大小：绝对值大的反而小。因为 $|-0.5|=0.5 > \\frac{1}{3}=|-\\frac{1}{3}|$，所以 $-0.5 < -\\frac{1}{3} < 0$，最小的是 $-0.5$。",
        difficulty: 2,
      },
      {
        id: "math_g7_rational_number_line_q4",
        type: "single_choice",
        content: "若 $|a-1|+|b+2|=0$，则 $a+b=$ （　）",
        options: ["$-1$", "$1$", "$3$", "$-3$"],
        answer: "A",
        explanation:
          "绝对值具有非负性，两个非负数之和为 $0$，则每个都为 $0$。所以 $a-1=0$ 得 $a=1$，$b+2=0$ 得 $b=-2$，故 $a+b=1+(-2)=-1$。",
        difficulty: 3,
      },
    ],
  },
  {
    id: "math_g7_rational_ops",
    title: "有理数的运算",
    grade: 7,
    chapter: "第一章 有理数",
    sortOrder: 2,
    questions: [
      {
        id: "math_g7_rational_ops_q1",
        type: "single_choice",
        content: "计算 $(-3)+7=$ （　）",
        options: ["$-10$", "$4$", "$-4$", "$10$"],
        answer: "B",
        explanation:
          "异号两数相加，取绝对值较大的符号，并用较大的绝对值减去较小的绝对值：$|-7|>|-3|$，取正号，$7-3=4$。",
        difficulty: 1,
      },
      {
        id: "math_g7_rational_ops_q2",
        type: "single_choice",
        content: "计算 $(-2)^3=$ （　）",
        options: ["$-8$", "$8$", "$-6$", "$6$"],
        answer: "A",
        explanation:
          "$(-2)^3$ 表示 $3$ 个 $(-2)$ 相乘：$(-2)\\times(-2)\\times(-2)=-8$。负数的奇次幂为负。",
        difficulty: 1,
      },
      {
        id: "math_g7_rational_ops_q3",
        type: "single_choice",
        content: "计算 $(-1)\\div\\frac{1}{3}\\times 3=$ （　）",
        options: ["$-9$", "$9$", "$-1$", "$1$"],
        answer: "A",
        explanation:
          "乘除混合运算从左到右依次进行：$(-1)\\div\\frac{1}{3}=(-1)\\times 3=-3$，再 $-3\\times 3=-9$。易错点：不能先算 $\\frac{1}{3}\\times 3=1$。",
        difficulty: 2,
      },
      {
        id: "math_g7_rational_ops_q4",
        type: "single_choice",
        content: "计算 $-2^2+(-2)^2-(-3)=$ （　）",
        options: ["$3$", "$-3$", "$7$", "$11$"],
        answer: "A",
        explanation:
          "注意 $-2^2$ 与 $(-2)^2$ 的区别：$-2^2=-(2\\times2)=-4$，而 $(-2)^2=4$。原式 $=-4+4+3=3$。",
        difficulty: 2,
      },
      {
        id: "math_g7_rational_ops_q5",
        type: "single_choice",
        content: "绝对值大于 $2$ 且小于 $5$ 的所有整数之和为（　）",
        options: ["$0$", "$7$", "$14$", "$-7$"],
        answer: "A",
        explanation:
          "满足条件的整数为 $\\pm3$、$\\pm4$，互为相反数的两数之和为 $0$，故总和为 $3+(-3)+4+(-4)=0$。",
        difficulty: 3,
      },
      {
        id: "math_g7_rational_ops_q6",
        type: "fill_in",
        content: "计算 $\\frac{1}{2}+\\frac{1}{6}+\\frac{1}{12}+\\frac{1}{20}=$ ______",
        answer: "4/5",
        explanation:
          "裂项相消：$\\frac{1}{n(n+1)}=\\frac{1}{n}-\\frac{1}{n+1}$。原式 $=(1-\\frac{1}{2})+(\\frac{1}{2}-\\frac{1}{3})+(\\frac{1}{3}-\\frac{1}{4})+(\\frac{1}{4}-\\frac{1}{5})=1-\\frac{1}{5}=\\frac{4}{5}$。",
        difficulty: 3,
      },
    ],
  },
  {
    id: "math_g7_polynomial",
    title: "整式加减与合并同类项",
    grade: 7,
    chapter: "第二章 整式的加减",
    sortOrder: 3,
    questions: [
      {
        id: "math_g7_polynomial_q1",
        type: "single_choice",
        content: "下列各组代数式中，是同类项的是（　）",
        options: ["$2x$ 与 $2x^2$", "$-3ab$ 与 $3ba$", "$x^2y$ 与 $xy^2$", "$2$ 与 $a$"],
        answer: "B",
        explanation:
          "同类项需满足：字母相同，且相同字母的指数也相同，与系数及字母顺序无关。$-3ab$ 与 $3ba$ 字母均为 $a,b$ 且指数都是 $1$，是同类项。",
        difficulty: 1,
      },
      {
        id: "math_g7_polynomial_q2",
        type: "fill_in",
        content: "合并同类项：$3x+5x-2x=$ ______",
        answer: "6x",
        explanation: "系数相加，字母及指数不变：$(3+5-2)x=6x$。",
        difficulty: 1,
      },
      {
        id: "math_g7_polynomial_q3",
        type: "single_choice",
        content: "化简 $2(a-b)-3(a-b)=$ （　）",
        options: ["$-a+b$", "$a-b$", "$-a-b$", "$a+b$"],
        answer: "A",
        explanation:
          "把 $(a-b)$ 看作整体：$(2-3)(a-b)=-(a-b)=-a+b$。去括号时注意变号：负号乘进去，$-a+b$。",
        difficulty: 2,
      },
      {
        id: "math_g7_polynomial_q4",
        type: "single_choice",
        content: "若 $3x^m y^2$ 与 $-2x^3 y^n$ 是同类项，则 $m+n=$ （　）",
        options: ["$5$", "$1$", "$6$", "$2$"],
        answer: "A",
        explanation:
          "由同类项定义：$x$ 的指数相等得 $m=3$，$y$ 的指数相等得 $n=2$，所以 $m+n=3+2=5$。",
        difficulty: 2,
      },
      {
        id: "math_g7_polynomial_q5",
        type: "fill_in",
        content: "先化简再求值：$2x^2-[3x^2-(x^2-2x)]$，其中 $x=-1$，结果为 ______",
        answer: "2",
        explanation:
          "去括号：原式 $=2x^2-3x^2+x^2-2x=-2x$。当 $x=-1$ 时，$-2\\times(-1)=2$。",
        difficulty: 3,
      },
    ],
  },
  {
    id: "math_g7_linear_eq",
    title: "一元一次方程求解",
    grade: 7,
    chapter: "第三章 一元一次方程",
    sortOrder: 4,
    questions: [
      {
        id: "math_g7_linear_eq_q1",
        type: "fill_in",
        content: "方程 $2x+1=7$ 的解为 $x=$ ______",
        answer: "3",
        explanation: "移项：$2x=7-1=6$，系数化为 $1$：$x=6\\div2=3$。",
        difficulty: 1,
      },
      {
        id: "math_g7_linear_eq_q2",
        type: "single_choice",
        content: "方程 $5x=3x-4$ 的解为（　）",
        options: ["$x=-2$", "$x=2$", "$x=-\\frac{1}{2}$", "$x=4$"],
        answer: "A",
        explanation: "移项：$5x-3x=-4$，即 $2x=-4$，解得 $x=-2$。注意移项要变号。",
        difficulty: 1,
      },
      {
        id: "math_g7_linear_eq_q3",
        type: "single_choice",
        content: "解方程 $\\frac{x}{2}-\\frac{x-1}{3}=1$，得 $x=$ （　）",
        options: ["$4$", "$-4$", "$\\frac{4}{5}$", "$-\\frac{4}{5}$"],
        answer: "A",
        explanation:
          "两边同乘 $6$ 去分母：$3x-2(x-1)=6$，去括号：$3x-2x+2=6$，解得 $x=4$。",
        difficulty: 2,
      },
      {
        id: "math_g7_linear_eq_q4",
        type: "fill_in",
        content: "若 $x=2$ 是方程 $ax+3=7$ 的解，则 $a=$ ______",
        answer: "2",
        explanation: "把 $x=2$ 代入方程：$2a+3=7$，得 $2a=4$，$a=2$。",
        difficulty: 2,
      },
      {
        id: "math_g7_linear_eq_q5",
        type: "single_choice",
        content: "解方程 $\\frac{2x+1}{3}-\\frac{5x-1}{6}=1$，得 $x=$ （　）",
        options: ["$-3$", "$3$", "$-\\frac{1}{3}$", "$\\frac{17}{3}$"],
        answer: "A",
        explanation:
          "两边同乘 $6$：$2(2x+1)-(5x-1)=6$，展开：$4x+2-5x+1=6$，即 $-x=3$，$x=-3$。",
        difficulty: 3,
      },
    ],
  },
  {
    id: "math_g7_linear_eq_app",
    title: "一元一次方程应用题",
    grade: 7,
    chapter: "第三章 一元一次方程",
    sortOrder: 5,
    questions: [
      {
        id: "math_g7_linear_eq_app_q1",
        type: "single_choice",
        content: "某数的 $3$ 倍加上 $5$ 等于 $20$，设该数为 $x$，则可列方程为（　）",
        options: ["$3x+5=20$", "$3(x+5)=20$", "$3x-5=20$", "$\\frac{x}{3}+5=20$"],
        answer: "A",
        explanation:
          "“某数的 3 倍”记为 $3x$，“加上 5”即 $3x+5$，“等于 20”得方程 $3x+5=20$。列方程的关键是按语句顺序翻译。",
        difficulty: 1,
      },
      {
        id: "math_g7_linear_eq_app_q2",
        type: "single_choice",
        content:
          "小明买了 $3$ 支笔和 $2$ 本笔记本共花 $19$ 元，已知笔每支 $3$ 元，则笔记本每本（　）元",
        options: ["$4$", "$5$", "$6$", "$7$"],
        answer: "B",
        explanation:
          "设笔记本每本 $x$ 元，由总价相等列方程：$3\\times3+2x=19$，解得 $2x=10$，$x=5$。",
        difficulty: 2,
      },
      {
        id: "math_g7_linear_eq_app_q3",
        type: "single_choice",
        content:
          "甲、乙两地相距 $240$ 千米，一辆汽车去时速度为 $60$ 千米/时，返回时速度为 $40$ 千米/时，往返一次共需（　）小时",
        options: ["$8$", "$9$", "$10$", "$12$"],
        answer: "C",
        explanation: "去时 $240\\div60=4$ 小时，返回 $240\\div40=6$ 小时，共 $4+6=10$ 小时。路程问题牢记：时间 $=$ 路程 $\\div$ 速度。",
        difficulty: 2,
      },
      {
        id: "math_g7_linear_eq_app_q4",
        type: "single_choice",
        content:
          "某商品按进价提高 $40\\%$ 后标价，再打 $8$ 折出售，仍可获利 $15$ 元，则进价为（　）元",
        options: ["$125$", "$120$", "$135$", "$150$"],
        answer: "A",
        explanation:
          "设进价 $x$ 元，售价 $=$ 标价 $\\times 0.8=x(1+40\\%)\\times0.8=1.12x$，利润 $=1.12x-x=15$，解得 $0.12x=15$，$x=125$。",
        difficulty: 3,
      },
    ],
  },
  {
    id: "math_g7_angle",
    title: "角度计算与余角补角",
    grade: 7,
    chapter: "第四章 几何图形初步",
    sortOrder: 6,
    questions: [
      {
        id: "math_g7_angle_q1",
        type: "single_choice",
        content: "$35^\\circ$ 的余角是（　）",
        options: ["$55^\\circ$", "$145^\\circ$", "$65^\\circ$", "$45^\\circ$"],
        answer: "A",
        explanation: "和为 $90^\\circ$ 的两角互余：$90^\\circ-35^\\circ=55^\\circ$。",
        difficulty: 1,
      },
      {
        id: "math_g7_angle_q2",
        type: "single_choice",
        content: "$60^\\circ$ 的补角是（　）",
        options: ["$30^\\circ$", "$120^\\circ$", "$150^\\circ$", "$100^\\circ$"],
        answer: "B",
        explanation: "和为 $180^\\circ$ 的两角互补：$180^\\circ-60^\\circ=120^\\circ$。",
        difficulty: 1,
      },
      {
        id: "math_g7_angle_q3",
        type: "single_choice",
        content: "一个角是它的补角的 $\\frac{1}{2}$，则这个角为（　）",
        options: ["$60^\\circ$", "$90^\\circ$", "$120^\\circ$", "$30^\\circ$"],
        answer: "A",
        explanation:
          "设这个角为 $x$，则补角为 $180^\\circ-x$，由题意 $x=\\frac{1}{2}(180^\\circ-x)$，即 $2x=180^\\circ-x$，解得 $x=60^\\circ$。",
        difficulty: 2,
      },
      {
        id: "math_g7_angle_q4",
        type: "fill_in",
        content: "时钟显示 $3:30$ 时，时针与分针的夹角为 ______ 度",
        answer: "75",
        explanation:
          "分针每分钟走 $6^\\circ$，时针每分钟走 $0.5^\\circ$。$3:30$ 时，分针指向数字 $6$（$180^\\circ$ 处），时针从数字 $3$ 走了 $30\\times0.5^\\circ=15^\\circ$，位于 $90^\\circ+15^\\circ=105^\\circ$ 处，夹角 $=180^\\circ-105^\\circ=75^\\circ$。",
        difficulty: 2,
      },
      {
        id: "math_g7_angle_q5",
        type: "single_choice",
        content: "一个角的余角比它的补角的 $\\frac{1}{3}$ 少 $10^\\circ$，则这个角为（　）",
        options: ["$60^\\circ$", "$45^\\circ$", "$30^\\circ$", "$75^\\circ$"],
        answer: "A",
        explanation:
          "设这个角为 $x$，则余角为 $90^\\circ-x$，补角为 $180^\\circ-x$。由题意 $90^\\circ-x=\\frac{1}{3}(180^\\circ-x)-10^\\circ$，去分母：$270^\\circ-3x=180^\\circ-x-30^\\circ$，解得 $x=60^\\circ$。验证：余角 $30^\\circ=\\frac{120^\\circ}{3}-10^\\circ$ 成立。",
        difficulty: 3,
      },
    ],
  },
  {
    id: "math_g8_triangle",
    title: "三角形基本性质与内角和",
    grade: 8,
    chapter: "第十一章 三角形",
    sortOrder: 7,
    questions: [
      {
        id: "math_g8_triangle_q1",
        type: "single_choice",
        content: "在 $\\triangle ABC$ 中，$\\angle A=50^\\circ$，$\\angle B=60^\\circ$，则 $\\angle C=$ （　）",
        options: ["$60^\\circ$", "$70^\\circ$", "$80^\\circ$", "$50^\\circ$"],
        answer: "B",
        explanation:
          "三角形内角和为 $180^\\circ$：$\\angle C=180^\\circ-50^\\circ-60^\\circ=70^\\circ$。",
        difficulty: 1,
      },
      {
        id: "math_g8_triangle_q2",
        type: "single_choice",
        content: "三角形两边的长分别为 $3$ 和 $5$，则第三边长 $x$ 的取值范围是（　）",
        options: [
          "$2 < x < 8$",
          "$2 \\le x \\le 8$",
          "$3 < x < 5$",
          "$x < 8$",
        ],
        answer: "A",
        explanation:
          "三角形三边关系：两边之差 $<$ 第三边 $<$ 两边之和，即 $5-3 < x < 5+3$，得 $2<x<8$。",
        difficulty: 1,
      },
      {
        id: "math_g8_triangle_q3",
        type: "single_choice",
        content: "等腰三角形的两边长分别为 $4$ 和 $9$，则它的周长为（　）",
        options: ["$17$", "$22$", "$17$ 或 $22$", "不能确定"],
        answer: "B",
        explanation:
          "分情况讨论：若腰为 $4$，三边 $4,4,9$ 不满足 $4+4>9$，舍去；若腰为 $9$，三边 $4,9,9$ 满足三边关系，周长 $=4+9+9=22$。",
        difficulty: 2,
      },
      {
        id: "math_g8_triangle_q4",
        type: "single_choice",
        content:
          "三角形的一个外角为 $100^\\circ$，与它不相邻的一个内角为 $40^\\circ$，则另一个与它不相邻的内角为（　）",
        options: ["$40^\\circ$", "$50^\\circ$", "$60^\\circ$", "$80^\\circ$"],
        answer: "C",
        explanation:
          "外角等于与它不相邻的两个内角之和：$100^\\circ-40^\\circ=60^\\circ$。（也可由内角和验证：相邻内角 $80^\\circ$，$180^\\circ-80^\\circ-40^\\circ=60^\\circ$。）",
        difficulty: 2,
      },
      {
        id: "math_g8_triangle_q5",
        type: "single_choice",
        content: "在 $\\triangle ABC$ 中，$\\angle A : \\angle B : \\angle C = 1 : 2 : 3$，则此三角形为（　）",
        options: ["直角三角形", "等腰三角形", "等边三角形", "钝角三角形"],
        answer: "A",
        explanation:
          "设三个内角为 $x,2x,3x$，由内角和 $6x=180^\\circ$，得 $x=30^\\circ$，三内角为 $30^\\circ,60^\\circ,90^\\circ$，是直角三角形。",
        difficulty: 3,
      },
    ],
  },
  {
    id: "math_g8_radicals",
    title: "二次根式的运算",
    grade: 8,
    chapter: "第十六章 二次根式",
    sortOrder: 8,
    questions: [
      {
        id: "math_g8_radicals_q1",
        type: "single_choice",
        content: "$\\sqrt{16}=$ （　）",
        options: ["$\\pm4$", "$4$", "$8$", "$2$"],
        answer: "B",
        explanation:
          "$\\sqrt{16}$ 表示 $16$ 的算术平方根（非负），结果为 $4$。注意 $\\pm4$ 是方程 $x^2=16$ 的解，不是 $\\sqrt{16}$ 的值。",
        difficulty: 1,
      },
      {
        id: "math_g8_radicals_q2",
        type: "single_choice",
        content: "若二次根式 $\\sqrt{x-2}$ 有意义，则 $x$ 的取值范围是（　）",
        options: ["$x > 2$", "$x \\ge 2$", "$x \\le 2$", "$x \\ne 2$"],
        answer: "B",
        explanation: "二次根式的被开方数必须非负：$x-2\\ge0$，解得 $x\\ge2$。",
        difficulty: 1,
      },
      {
        id: "math_g8_radicals_q3",
        type: "single_choice",
        content: "计算 $\\sqrt{8}\\times\\sqrt{2}=$ （　）",
        options: ["$4$", "$2\\sqrt{2}$", "$\\sqrt{10}$", "$16$"],
        answer: "A",
        explanation:
          "二次根式乘法：$\\sqrt{a}\\times\\sqrt{b}=\\sqrt{ab}$，原式 $=\\sqrt{16}=4$。",
        difficulty: 2,
      },
      {
        id: "math_g8_radicals_q4",
        type: "single_choice",
        content: "化简 $\\sqrt{18}-\\sqrt{2}=$ （　）",
        options: ["$2\\sqrt{2}$", "$4\\sqrt{2}$", "$\\sqrt{16}$", "$3\\sqrt{2}$"],
        answer: "A",
        explanation: "先化简再合并：$\\sqrt{18}=\\sqrt{9\\times2}=3\\sqrt{2}$，原式 $=3\\sqrt{2}-\\sqrt{2}=2\\sqrt{2}$。",
        difficulty: 2,
      },
      {
        id: "math_g8_radicals_q5",
        type: "single_choice",
        content: "计算 $(\\sqrt{3}+\\sqrt{2})(\\sqrt{3}-\\sqrt{2})=$ （　）",
        options: ["$1$", "$5$", "$\\sqrt{5}$", "$-1$"],
        answer: "A",
        explanation:
          "平方差公式 $(a+b)(a-b)=a^2-b^2$：原式 $=(\\sqrt{3})^2-(\\sqrt{2})^2=3-2=1$。",
        difficulty: 3,
      },
    ],
  },
  {
    id: "math_g8_pythagoras",
    title: "勾股定理",
    grade: 8,
    chapter: "第十七章 勾股定理",
    sortOrder: 9,
    questions: [
      {
        id: "math_g8_pythagoras_q1",
        type: "single_choice",
        content: "直角三角形的两条直角边长分别为 $3$ 和 $4$，则斜边长为（　）",
        options: ["$5$", "$7$", "$\\sqrt{7}$", "$6$"],
        answer: "A",
        explanation: "勾股定理：斜边 $=\\sqrt{3^2+4^2}=\\sqrt{9+16}=\\sqrt{25}=5$。",
        difficulty: 1,
      },
      {
        id: "math_g8_pythagoras_q2",
        type: "single_choice",
        content: "直角三角形的斜边长为 $13$，一条直角边长为 $5$，则另一条直角边长为（　）",
        options: ["$12$", "$8$", "$\\sqrt{194}$", "$14$"],
        answer: "A",
        explanation: "勾股定理：另一直角边 $=\\sqrt{13^2-5^2}=\\sqrt{169-25}=\\sqrt{144}=12$。",
        difficulty: 1,
      },
      {
        id: "math_g8_pythagoras_q3",
        type: "fill_in",
        content: "直角三角形的两条直角边长分别为 $5$ 和 $12$，则斜边上的高为 ______",
        answer: "60/13",
        explanation:
          "由勾股定理斜边 $=\\sqrt{25+144}=13$。利用面积法：$\\frac{1}{2}\\times5\\times12=\\frac{1}{2}\\times13\\times h$，解得 $h=\\frac{60}{13}$。",
        difficulty: 2,
      },
      {
        id: "math_g8_pythagoras_q4",
        type: "single_choice",
        content: "三角形的三边长分别为 $6$、$8$、$10$，则此三角形是（　）",
        options: ["直角三角形", "锐角三角形", "钝角三角形", "等腰三角形"],
        answer: "A",
        explanation:
          "勾股定理逆定理：若 $a^2+b^2=c^2$，则为直角三角形。验证：$6^2+8^2=36+64=100=10^2$，成立。",
        difficulty: 2,
      },
      {
        id: "math_g8_pythagoras_q5",
        type: "single_choice",
        content:
          "一架长 $2.5$ 米的梯子斜靠在墙上，梯子顶端距地面 $2.4$ 米。若梯子顶端沿墙下滑 $0.4$ 米，则梯子底端将外移（　）米",
        options: ["$0.8$", "$0.4$", "$0.7$", "$1.5$"],
        answer: "A",
        explanation:
          "开始时梯脚距墙 $\\sqrt{2.5^2-2.4^2}=\\sqrt{6.25-5.76}=\\sqrt{0.49}=0.7$ 米；下滑后顶端高 $2.4-0.4=2$ 米，梯脚距墙 $\\sqrt{2.5^2-2^2}=\\sqrt{2.25}=1.5$ 米，外移 $1.5-0.7=0.8$ 米。",
        difficulty: 3,
      },
    ],
  },
  {
    id: "math_g8_linear_func",
    title: "一次函数图象与性质",
    grade: 8,
    chapter: "第十九章 一次函数",
    sortOrder: 10,
    questions: [
      {
        id: "math_g8_linear_func_q1",
        type: "single_choice",
        content: "一次函数 $y=2x-1$ 的图象不经过（　）",
        options: ["第一象限", "第二象限", "第三象限", "第四象限"],
        answer: "B",
        explanation:
          "$k=2>0$ 过一、三象限；$b=-1<0$ 与 $y$ 轴交于负半轴，向下平移过第四象限。故图象经过一、三、四象限，不经过第二象限。",
        difficulty: 1,
      },
      {
        id: "math_g8_linear_func_q2",
        type: "single_choice",
        content: "直线 $y=-3x+6$ 与 $x$ 轴的交点坐标为（　）",
        options: ["$(2,0)$", "$(0,2)$", "$(6,0)$", "$(0,6)$"],
        answer: "A",
        explanation: "与 $x$ 轴相交时 $y=0$：$-3x+6=0$，解得 $x=2$，交点为 $(2,0)$。",
        difficulty: 1,
      },
      {
        id: "math_g8_linear_func_q3",
        type: "single_choice",
        content: "一次函数 $y=kx+b$ 的图象经过点 $(1,3)$ 和点 $(0,1)$，则其解析式为（　）",
        options: ["$y=2x+1$", "$y=x+2$", "$y=3x$", "$y=2x-1$"],
        answer: "A",
        explanation:
          "点 $(0,1)$ 在 $y$ 轴上，故 $b=1$；把 $(1,3)$ 代入：$k+1=3$，得 $k=2$。解析式为 $y=2x+1$。",
        difficulty: 2,
      },
      {
        id: "math_g8_linear_func_q4",
        type: "single_choice",
        content: "已知一次函数 $y=(m-2)x+3$ 中，$y$ 随 $x$ 的增大而减小，则 $m$ 的取值范围是（　）",
        options: ["$m>2$", "$m<2$", "$m \\ne 2$", "$m=2$"],
        answer: "B",
        explanation:
          "$y$ 随 $x$ 增大而减小 $\\Leftrightarrow k<0$，即 $m-2<0$，解得 $m<2$。（另外一次函数要求 $m\\ne2$，两者取交集仍为 $m<2$。）",
        difficulty: 2,
      },
      {
        id: "math_g8_linear_func_q5",
        type: "fill_in",
        content: "直线 $y=2x+4$ 与两坐标轴围成的三角形面积为 ______",
        answer: "4",
        explanation:
          "与 $x$ 轴交点：令 $y=0$ 得 $x=-2$，即 $(-2,0)$；与 $y$ 轴交点：$(0,4)$。面积 $=\\frac{1}{2}\\times2\\times4=4$。",
        difficulty: 3,
      },
    ],
  },
  {
    id: "math_g9_quadratic",
    title: "一元二次方程",
    grade: 9,
    chapter: "第二十一章 一元二次方程",
    sortOrder: 11,
    questions: [
      {
        id: "math_g9_quadratic_q1",
        type: "single_choice",
        content: "方程 $x^2-4=0$ 的解为（　）",
        options: ["$x=\\pm2$", "$x=2$", "$x=-2$", "$x=4$"],
        answer: "A",
        explanation: "移项：$x^2=4$，直接开平方：$x=\\pm\\sqrt{4}=\\pm2$。注意正负两解都不能丢。",
        difficulty: 1,
      },
      {
        id: "math_g9_quadratic_q2",
        type: "single_choice",
        content: "方程 $x^2-3x+2=0$ 的解为（　）",
        options: ["$x_1=1,\\ x_2=2$", "$x_1=-1,\\ x_2=-2$", "$x_1=1,\\ x_2=-2$", "$x=3$"],
        answer: "A",
        explanation: "因式分解：$(x-1)(x-2)=0$，所以 $x-1=0$ 或 $x-2=0$，得 $x_1=1$，$x_2=2$。",
        difficulty: 1,
      },
      {
        id: "math_g9_quadratic_q3",
        type: "single_choice",
        content: "用公式法解方程 $x^2-2x-1=0$，正确的结果是（　）",
        options: [
          "$x=1\\pm\\sqrt{2}$",
          "$x=-1\\pm\\sqrt{2}$",
          "$x=1\\pm\\sqrt{6}$",
          "$x=2\\pm\\sqrt{2}$",
        ],
        answer: "A",
        explanation:
          "求根公式 $x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$。这里 $a=1,b=-2,c=-1$，判别式 $\\Delta=(-2)^2-4\\times1\\times(-1)=8$，$x=\\frac{2\\pm\\sqrt{8}}{2}=\\frac{2\\pm2\\sqrt{2}}{2}=1\\pm\\sqrt{2}$。",
        difficulty: 2,
      },
      {
        id: "math_g9_quadratic_q4",
        type: "single_choice",
        content: "若关于 $x$ 的方程 $x^2+2x+c=0$ 有两个相等的实数根，则 $c=$ （　）",
        options: ["$1$", "$-1$", "$2$", "$0$"],
        answer: "A",
        explanation:
          "两根相等 $\\Leftrightarrow$ 判别式 $\\Delta=0$：$\\Delta=2^2-4\\times1\\times c=4-4c=0$，解得 $c=1$。",
        difficulty: 2,
      },
      {
        id: "math_g9_quadratic_q5",
        type: "fill_in",
        content:
          "某商品原价 $100$ 元，连续两次降价后为 $81$ 元，则平均每次降价的百分率为 ______%（填数字）",
        answer: "10",
        explanation:
          "设平均每次降价百分率为 $x$，则 $100(1-x)^2=81$，即 $(1-x)^2=0.81$，$1-x=\\pm0.9$。舍去负根（降价率不能超过 $100\\%$），得 $x=0.1=10\\%$。",
        difficulty: 3,
      },
    ],
  },
];

async function main() {
  for (const node of NODES) {
    await prisma.knowledgeNode.upsert({
      where: { id: node.id },
      create: {
        id: node.id,
        title: node.title,
        subject: "math",
        grade: node.grade,
        chapter: node.chapter,
        sortOrder: node.sortOrder,
      },
      update: {
        title: node.title,
        grade: node.grade,
        chapter: node.chapter,
        sortOrder: node.sortOrder,
      },
    });

    for (const [index, q] of node.questions.entries()) {
      const data = {
        nodeId: node.id,
        type: q.type,
        content: q.content,
        options: q.options ? JSON.stringify(q.options) : null,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        sortOrder: index + 1,
      };
      await prisma.question.upsert({
        where: { id: q.id },
        create: { id: q.id, ...data },
        update: data,
      });
    }
    console.log(`✓ ${node.id}: ${node.questions.length} 题`);
  }

  const [nodeCount, questionCount] = await Promise.all([
    prisma.knowledgeNode.count(),
    prisma.question.count(),
  ]);
  console.log(`种子完成：${nodeCount} 个知识点，${questionCount} 道题。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
