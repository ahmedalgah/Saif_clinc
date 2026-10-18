import express from "express";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(helmet());
app.use(express.json({ limit: "8kb" }));
app.use(express.static("public"));
const limiter = rateLimit({ windowMs: 60_000, limit: 12, standardHeaders: "draft-7", legacyHeaders: false });
app.use("/api/chat", limiter);

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_MODEL;
const clinicRules = `
أنت المساعد المعلوماتي لعيادة سيف الدين محمد علي للطب العام في قرية الرواشدة، ولاية القضارف، السودان.
تحدث بالعربية الواضحة، ويمكنك استخدام اللهجة السودانية بلطف. عرّف نفسك دائماً كمساعد معلوماتي آلي وليس طبيباً.
يمكنك الإجابة عن معلومات العيادة المعروفة فقط: الاسم، التخصص طب عام، العنوان قرية الرواشدة بولاية القضارف. لا تخترع رقم هاتف أو ساعات عمل أو أسعاراً أو خدمات غير مؤكدة.
يمكنك تقديم معلومات صحية عامة ومحايدة، لكن لا تشخّص ولا تستبعد مرضاً ولا تصف دواءً أو جرعة ولا توجّه المستخدم لإيقاف علاج موصوف. شجّع على مراجعة مختص للتقييم الفردي.
إذا ذكر المستخدم صعوبة شديدة في التنفس، ألماً شديداً أو ضغطاً في الصدر، فقدان الوعي، علامات سكتة دماغية، نزيفاً شديداً، تشنجاً مستمراً أو خطراً فورياً، وجّهه لطلب الطوارئ/أقرب مرفق صحي فوراً ولا تؤخره بأسئلة.
لا تطلب الاسم الكامل أو رقم الهوية أو صور الفحوصات أو تفاصيل شخصية غير ضرورية. ذكّر المستخدم بعدم مشاركة معلومات حساسة. لا تعد بسرية مطلقة.
إذا كان السؤال غير واضح أو عالي الخطورة، وضّح حدودك ووجّه لمختص بشري.
اجعل الرد موجزاً، ولا تدّع أنك حجزت موعداً أو تواصلت مع العيادة.
`;

app.post("/api/chat", async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message || message.length > 1000) return res.status(400).json({ reply: "اكتب سؤالاً قصيراً لا يتجاوز 1000 حرف." });
  if (!process.env.OPENAI_API_KEY || !model) return res.status(503).json({ reply: "خدمة المساعد الذكي لم تُفعّل بعد. يرجى التواصل مع العيادة مباشرة." });
  try {
    const response = await client.responses.create({
      model,
      store: false,
      input: [
        { role: "system", content: clinicRules },
        { role: "user", content: message }
      ],
      max_output_tokens: 350
    });
    res.json({ reply: response.output_text || "عذراً، ما قدرت أجهّز الرد الآن. جرّب لاحقاً." });
  } catch (err) {
    console.error("Chat request failed", err?.status || "unknown");
    res.status(502).json({ reply: "عذراً، الخدمة غير متاحة مؤقتاً. تواصل مع العيادة أو اطلب الرعاية العاجلة إذا كانت الحالة طارئة." });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Clinic chatbot server listening on ${port}`));
