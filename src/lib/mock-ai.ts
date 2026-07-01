import type { BreakdownStep } from "./db";

const uid = (): string => crypto.randomUUID();

function delay(ms = 800): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

// ---------------------------------------------------------------------------
// Neuro-affirming "discovery" templates
//
// Each entry describes what ACTUALLY happened — no judgment, no assumed
// struggle, no adversity narrative.  The goal is to help the user notice
// small changes, real investments, and easily-overlooked value.
// ---------------------------------------------------------------------------

const SPARKLE_TEMPLATES: Record<string, string[]> = {
  meal: [
    "今天花了一些时间，照顾了自己的身体。",
    "在不知道吃什么的时候，还是为自己做了一个决定。",
    "动手把食材变成了可以吃的食物。",
    "允许这顿饭以它自己的节奏完成。",
  ],
  walk: [
    "今天把身体从室内带到了户外。",
    "在外面待了一段时间，感受到了外面的空气。",
    "让自己的身体动了起来。",
    "用自己觉得舒服的速度走了一段路。",
  ],
  sleep: [
    "在需要的时候，让自己停下来休息了。",
    "为入睡做了一些准备，把环境调整得更舒服了一点。",
    "没有继续做事，而是选择了休息。",
    "在睡前给了自己几个深呼吸的时间。",
  ],
  work: [
    "今天让这件事情向前移动了一点。",
    "做了一些，然后停了下来——没有透支自己。",
    "把今天的真实状态记了下来。",
    "为这件事投入了一部分自己的时间和注意力。",
  ],
  social: [
    "今天和另一个人产生了连接。",
    "在对话中同时处理了语言、表情和语气。",
    "在互动中保留了一部分自己。",
    "结束后回到了属于自己的空间。",
  ],
  default: [
    "今天停下来，注意到了一件自己做过的事。",
    "没有等到事情完美才记录——记下了它真实的样子。",
    "把注意力放在了这件看起来普通的事情上。",
    "为今天的自己留下了一点记录。",
  ],
};

const PRAISE_TEMPLATES = [
  "「{step}」——你注意到了这件事。很多时候我们做完就忘了，但你看见了它。",
  "「{step}」——你在用自己的速度往前走，这就是今天真实的样子。",
  "「{step}」——每一件小事都会在时间里留下痕迹。",
  "「{step}」——今天的世界因为这件事，和昨天有了一点不同。",
  "「{step}」——你为今天的自己做了一点什么。",
  "「{step}」——只是看见，不比较，不评判。",
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract 3-4 discovery-oriented "bright spots" from a user's event.
 * These are NOT physical steps — they're things the user might not have
 * noticed about what they did.
 */
export async function generateBreakdown(
  _event: string
): Promise<BreakdownStep[]> {
  await delay();

  const lower = _event.toLowerCase();
  let steps: string[];

  if (
    lower.includes("吃") ||
    lower.includes("饭") ||
    lower.includes("餐") ||
    lower.includes("food") ||
    lower.includes("eat") ||
    lower.includes("meal") ||
    lower.includes("做菜") ||
    lower.includes("煮")
  ) {
    steps = SPARKLE_TEMPLATES.meal;
  } else if (
    lower.includes("走") ||
    lower.includes("散步") ||
    lower.includes("walk") ||
    lower.includes("出门") ||
    lower.includes("出去") ||
    lower.includes("跑步") ||
    lower.includes("运动")
  ) {
    steps = SPARKLE_TEMPLATES.walk;
  } else if (
    lower.includes("睡") ||
    lower.includes("休息") ||
    lower.includes("床") ||
    lower.includes("sleep") ||
    lower.includes("bed") ||
    lower.includes("躺")
  ) {
    steps = SPARKLE_TEMPLATES.sleep;
  } else if (
    lower.includes("工作") ||
    lower.includes("代码") ||
    lower.includes("写") ||
    lower.includes("项目") ||
    lower.includes("翻译") ||
    lower.includes("work") ||
    lower.includes("code") ||
    lower.includes("任务") ||
    lower.includes("计划")
  ) {
    steps = SPARKLE_TEMPLATES.work;
  } else if (
    lower.includes("聊天") ||
    lower.includes("朋友") ||
    lower.includes("聚会") ||
    lower.includes("电话") ||
    lower.includes("社交") ||
    lower.includes("social") ||
    lower.includes("见面") ||
    lower.includes("回复") ||
    lower.includes("消息")
  ) {
    steps = SPARKLE_TEMPLATES.social;
  } else {
    steps = SPARKLE_TEMPLATES.default;
  }

  return steps.map((content) => ({
    id: uid(),
    content,
    praise: "",
  }));
}

/**
 * Generate a gentle, discovery-oriented response for a bright-spot insight.
 */
export async function generatePraise(step: string): Promise<string> {
  await delay(400);
  const template =
    PRAISE_TEMPLATES[Math.floor(Math.random() * PRAISE_TEMPLATES.length)];
  return template.replace("{step}", step);
}
