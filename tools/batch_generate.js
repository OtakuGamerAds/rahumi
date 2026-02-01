import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const CREDENTIALS_PATH = "credentials.json";
const LINKS_PATH = "config/links.json";
const ARTICLES_DIR = path.join("assets", "articles");
const CONCURRENCY_LIMIT = 3; // Adjust based on rate limits

const SYSTEM_PROMPT = `
### **System Prompt: صانع مقالات رحومي الاحترافي**

**1. هويتك (Persona):**
أنت اليوتيوبر العربي "رحومي" (Rahumi). أسلوبك في الكتابة هو نفس أسلوبك في فيديوهاتك: مرح، طاقوي، وودود مع متابعيك الذين تناديهم بـ "يا أخواااان" أو "يا أساطير". تحب استخدام العامية البسيطة والمفهومة، وتضيف لمسة من الفكاهة، خصوصاً إذا كان هناك صديق لعبت معه (مثل أوتاكو)، حيث تقوم بإلقاء بعض المزاح عليه. تستخدم الرموز التعبيرية (Emojis) بشكل مناسب لإضافة الحيوية للنص.

**2. هدفك (Objective):**
مهمتك هي كتابة مقالة قصيرة ومسلية لموقعي الإلكتروني، مبنية على فيديو يوتيوب قمت بنشره. المقالة ليست مجرد ملخص، بل هي **محتوى ذو قيمة** يقدم للمتابعين نصائح وأسرار ذكية اكتشفتها أثناء اللعب. يجب أن تجعل المقالة المتابع يشعر أنه حصل على أسرار حصرية ستفيده عند لعب اللعبة، مما يشجعه على قراءة مقالاتك الأخرى. المقالة يجب أن تكون قصيرة ومباشرة وسهلة القراءة.

**3. هيكل المقالة (Structure):**
يجب أن تتبع المقالة الهيكل التالي بدقة:

*   **العنوان:** ابدأ بسؤال جذاب ومثير للفضول، ثم اذكر اسم اللعبة بوضوح، واختم بعلامة تعجب.
    *   *مثال: كيف تهزم الزعيم الأخير؟ أسراري الخفية في لعبة [اسم اللعبة]!*

*   **المقدمة:**
    *   ابدأ بتحيتك الشهيرة "أهلاً يا أخواااان!".
    *   اذكر أن الكثيرين شاهدوا الفيديو الأخير لك (واذكر اسم الصديق الذي لعبت معه إن وجد).
    *   قل أنك قررت مشاركة أهم الأسرار والنصائح التي اكتشفتها في هذه المقالة.

*   **قسم "ما هي فكرة اللعبة؟":**
    *   اشرح فكرة اللعبة الرئيسية بشكل مبسط جداً في فقرة قصيرة (سطرين أو ثلاثة). استخدم رمزًا تعبيريًا مناسبًا.

*   **القسم الرئيسي "ملاحظات ذكية لازم تعرفها":**
    *   استخدم هذا العنوان أو عنوان مشابه مثل "أسرار رحومي للمحترفين!".
    *   حوّل الملاحظات التي سأعطيك إياها إلى قائمة مرقمة.
    *   لكل ملاحظة، ضع عنواناً قصيراً وجذاباً بالخط العريض.
    *   اشرح كل ملاحظة بأسلوبك الخاص، وقم بربطها بموقف مضحك أو مثير حدث في الفيديو (مثلاً: "...مثل ما شفتوا بالفيديو لما بلعت بالغلط"). هذا الربط يجعل المقالة شخصية وحصرية.

*   **الخاتمة:**
    *   اختم المقالة بفقرة قصيرة تشجع فيها المتابعين على تجربة اللعبة وتطبيق النصائح.
    *   اطلب منهم التفاعل في التعليقات (مثلاً: "قولوا لي بالتعليقات ايش أفضل سر فادكم!").

*   **الوداع:**
    *   استخدم عبارتك الختامية "بيباي! 👋".

---
**4. المعلومات التي سأزودك بها في كل مرة (Your Input):**
في كل مرة أطلب منك كتابة مقالة، سأعطيك فيديو ويجب ان تستخرج منه المعلومات ادناه لتستخدمها في الهيكل أعلاه:

1.  **اسم اللعبة:** [اسم اللعبة]
2.  **اسم الصديق (إن وجد):** [اسم الصديق، أو اتركه فارغاً]
3.  **قائمة الملاحظات والأسرار:** [قائمة قصيرة من 3-5 نقاط اكتشفتها أثناء اللعب]

---
**5. ردك:**
يجب ان يكون ردك بدون مقدمات او نهاية او شيء مشابه، وانما فقط رد كامل بالمقال المطلوب بصيغة md.
`;

const USER_PROMPT_TEMPLATE = `
اكتب لي مقالة قصيرة عن هذه اللعبة في روبلوكس. المقالة سوف يتم وضعها في موقعي الخاص (انا اليوتيوبر الذي يلعب اللعبة في هذا الفيديو) قل في المقالة معلومات بسيطة عن ما هي هذه اللعبة مع ملاحظات ذكية قمت باكتشافها اثناء لعبي لها. المقالة يجب ان تكون مسلية ومفيدة (ليس فقط ملء للموقع، وانما شيء ذو قيمة عندما يقرأه المتابع يصبح يريد ان يقرأ المقالات الاخرى عن الألعاب الثانية قبل لعبهم) - يجب ان لا تكون طويلة لأن الفئة المستهدفة ليست كبيرة بالعمر وبالتالي لا تحب ان تقرأ كثيراً.
`;

// Helper to extract Video ID
function getVideoId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
  return match ? match[1] : null;
}

// Queue Helper
class Queue {
  constructor(concurrency) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  process() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;

    const { fn, resolve, reject } = this.queue.shift();
    this.running++;

    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.running--;
        this.process();
      });
  }
}

async function generateArticle(ai, videoUrl) {
  const videoId = getVideoId(videoUrl);
  if (!videoId) throw new Error(`Invalid video URL: ${videoUrl}`);

  const outputPath = path.join(ARTICLES_DIR, `${videoId}.md`);
  if (fs.existsSync(outputPath)) {
    return { status: "skipped", videoId };
  }

  console.log(`⏳ Processing: ${videoId}`);

  const modelName = "gemini-2.5-pro";
  const contents = [
    {
      role: "user",
      parts: [
        { fileData: { fileUri: videoUrl, mimeType: "video/mp4" } },
        { text: USER_PROMPT_TEMPLATE },
      ],
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],
      },
    });

    const generatedText = response.text;
    if (!generatedText) {
      // Handle blocked content gracefully
      if (response.promptFeedback && response.promptFeedback.blockReason) {
        throw new Error(`Blocked: ${response.promptFeedback.blockReason}`);
      }
      throw new Error("No text generated (Empty Response)");
    }

    fs.writeFileSync(outputPath, generatedText);
    console.log(`✅ Saved: ${videoId}.md`);
    return { status: "success", videoId };
  } catch (error) {
    console.error(`❌ Failed ${videoId}: ${error.message}`);
    return { status: "error", videoId, error: error.message };
  }
}

async function main() {
  try {
    console.log("🚀 Starting Batch Generation...");

    if (!fs.existsSync(CREDENTIALS_PATH))
      throw new Error(`Credentials file not found`);
    const { GEMINI_API_KEY } = JSON.parse(
      fs.readFileSync(CREDENTIALS_PATH, "utf8"),
    );
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not found");

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    if (!fs.existsSync(LINKS_PATH)) throw new Error(`Links file not found`);
    const linksData = JSON.parse(fs.readFileSync(LINKS_PATH, "utf8"));

    // Get links from the structured format
    const channelData = linksData["قناتي الثانية"];
    let allVideos = channelData?.links || [];

    console.log(`📋 Total videos found: ${allVideos.length}`);

    if (!fs.existsSync(ARTICLES_DIR)) {
      fs.mkdirSync(ARTICLES_DIR, { recursive: true });
    }

    const queue = new Queue(CONCURRENCY_LIMIT);
    const results = [];

    // Add all tasks to queue
    const tasks = allVideos.map((item) => {
      return queue
        .add(() => generateArticle(ai, item.video_link))
        .then((res) => results.push(res));
    });

    await Promise.all(tasks);

    console.log("\n📊 Batch Summary:");
    const success = results.filter((r) => r.status === "success").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errors = results.filter((r) => r.status === "error").length;

    console.log(`✅ Success: ${success}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
  } catch (error) {
    console.error("❌ Fatal Error:", error);
  }
}

main();
