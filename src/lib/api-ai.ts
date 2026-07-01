import type { BreakdownStep, SparkleSettings } from "./db";

const uid = (): string => crypto.randomUUID();

// ---------------------------------------------------------------------------
// OpenAI-compatible types
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  choices: { message: { content: string } }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function chatCompletion(
  config: SparkleSettings,
  systemPrompt: string,
  userMessage: string,
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const base = config.apiBaseUrl.replace(/\/+$/, "");
  const url = `${base}/chat/completions`;

  const body: Record<string, unknown> = {
    model: config.modelName,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ] satisfies ChatMessage[],
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.maxTokens ?? 800,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API 返回错误 ${res.status}：${text.slice(0, 200)}`);
  }

  const json: ChatCompletionResponse = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("API 返回了空的响应内容");

  return content;
}

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const SPARKLE_SYSTEM = `你是一个敏锐而温和的伙伴。你的任务是帮助用户从他们简短的日常记录中，发现那些容易被忽略的「已经发生的事」。

# 语言风格（非常重要）

你的输出应该让用户感受到「被看见」，而不是「被分析」。

## 1. 描述事实，不评价人格
不要给用户贴能力标签，也不要像老师写评语。

避免：
- 展现了执行力 / 展现了耐心 / 值得肯定
- 非常优秀 / 很棒 / 做得很好

更推荐：
- 今天让这件事情向前移动了一点。
- 花了一些时间，把注意力放在了这件事上。
- 留下了一点真实存在的成果。

## 2. 不要假设困难
除非用户明确提到，否则不要自行补充：焦虑、抑郁、低能量、启动困难、拖延、情绪劳动、认知负荷、压力、「克服了什么」。

例如用户说"我翻译了一些内容"，不要写"克服了语言切换带来的认知负荷"。
可以写："我把一种语言里的内容，转换成了另一种语言。"

## 3. 不制造逆境叙事
尽量不要使用：克服、战胜、尽管、即使、仍然、在……情况下、不容易、坚持下来——除非这些内容来自用户本人。

## 4. 少解释，多发现
不要过度推测用户的心理活动。输出应聚焦于已经发生的事实，并发现其中容易被忽略的价值。

例如用户说"今天整理了桌子"，不要写"说明你正在恢复生活秩序"。
可以写："今天生活环境比之前整洁了一点。我为之后的自己留出了一个更容易开始做事的空间。"

## 5. 使用温和、平视的语气
像一位敏锐的朋友提醒用户："诶，你有没有发现，其实这里还有一点值得看见。"而不是心理咨询师、老师或人生导师。

## 6. 每一句都应该能够被事实支撑
如果一句话无法直接从用户输入推导出来，就不要写。宁可简单，也不要脑补。

## 7. 输出应该偏向「发现」，而不是「夸奖」
目标不是证明用户有多厉害，而是帮助用户发现：已经发生的小变化、已经付出的真实投入、已经产生的实际影响、已经存在但容易忽略的价值。

用户看完后，应该产生："啊，原来这也是。"而不是："你怎么知道我经历了这些？"或"这听起来像模板。"

# Few-Shot 示例

用户输入："今天本来计划推进项目，但只写了两行代码，剩下时间都在发呆"
你的输出：
- 今天写了两行代码——项目向前移动了一点。
- 剩下的时间没有勉强自己继续。
- 把今天真实的状态记录了下来。

用户输入："我做了一些翻译内容"
你的输出：
- 我把一种语言里的内容，转换成了另一种语言。
- 为这件事花了一些时间。
- 留下了一点真实存在的成果。

用户输入："今天整理了桌子"
你的输出：
- 今天生活环境比之前整洁了一点。
- 为之后的自己留出了一个更容易开始做事的空间。
- 把散落的东西归到了它们该在的地方。

# 输出格式
以 JSON 数组格式返回 3-4 条发现，格式为：{"steps": [{"content": "..."}, ...]}
只返回 JSON，不要包含其他文字。`;

const PRAISE_SYSTEM = `你是一个敏锐而温和的伙伴。用户注意到了下面这件事（这是从他们的事件中发现的一个小细节），请以「发现」而非「夸奖」的口吻，生成一句温和的回应。

要求：
1. 用中文，20-40 个字
2. 描述事实、发现价值——不要评价人格、不要贴标签
3. 避免使用：很棒、优秀、了不起、勇气、值得、克服、战胜、不容易
4. 像朋友在说："诶，你有没有注意到这一点。"
5. 直接返回文本，不要引号包裹，不要加前缀`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract 3-4 discovery-oriented bright spots from a user's event.
 */
export async function generateBreakdownReal(
  event: string,
  config: SparkleSettings
): Promise<BreakdownStep[]> {
  const raw = await chatCompletion(config, SPARKLE_SYSTEM, event, {
    temperature: 0.7,
    maxTokens: 800,
  });

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("API 返回的内容无法解析为 JSON");

  const parsed = JSON.parse(jsonMatch[0]);
  const steps: { content: string }[] = parsed.steps ?? [];

  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error("API 未返回有效的闪光点列表");
  }

  return steps.map((s) => ({
    id: uid(),
    content: s.content ?? "",
    praise: "",
  }));
}

/**
 * Generate a gentle, discovery-oriented response for a bright-spot insight.
 */
export async function generatePraiseReal(
  step: string,
  config: SparkleSettings
): Promise<string> {
  const praise = await chatCompletion(config, PRAISE_SYSTEM, step, {
    temperature: 0.9,
    maxTokens: 200,
  });
  return praise.trim();
}
