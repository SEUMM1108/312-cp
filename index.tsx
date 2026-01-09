import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import OpenAI from "openai";

// Initialize Qwen API (via Alibaba DashScope)
const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY, // 记得去Vercel后台把变量名改成这个，或者改代码里的名字
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", // 阿里云的专属地址
    dangerouslyAllowBrowser: true // 允许在浏览器前端直接运行
});

const STYLES = [
  "甜宠 (Sweet/Fluff)",
  "虐心 (Angst)",
  "搞笑 (Comedy)",
  "相爱相杀 (Enemies to Lovers)",
  "暗恋 (Unrequited Love)",
  "日常 (Slice of Life)",
  "职场/学术 (Academic/Workplace)",
  "破镜重圆 (Reunion)",
];

const CHARACTER_GROUPS = [
  {
    group: "BOSS 组",
    members: ["周小舟 (大导师/女)", "余潇群 (小导师/男)"]
  },
  {
    group: "博士组 (老资历)",
    members: ["韩己臣 (男)", "朱隽宇 (男)", "王柏捷 (男)", "巫明蓉 (女)", "李翰林 (男)"]
  },
  {
    group: "硕士·研三 (老油条)",
    members: ["蒋厚泽 (男)", "陈诚 (男)", "马一松 (男)", "何雅怡 (女)", "吴航 (女)", "章雨昕 (女)"]
  },
  {
    group: "硕士·研二 (干活主力)",
    members: ["陈玲 (女)", "黎若渝 (女)", "马濛 (男)", "吴佳庆 (男)", "王志轩 (男)"]
  },
  {
    group: "硕士·研一 (萌新)",
    members: ["郝宇森 (男)", "陈嘉怡 (女)", "虞逸凡 (女)", "徐瑜增 (男)"]
  },
  {
    group: "本科 (团宠)",
    members: ["巴程涛"]
  }
];

const App = () => {
  const [personA, setPersonA] = useState("");
  const [personB, setPersonB] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [setting, setSetting] = useState("");
  const [story, setStory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as story generates
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [story]);

  const generateStory = async () => {
    if (!personA || !personB) {
      alert("请从列表中选择两个角色 / Please select both characters from the list.");
      return;
    }

    setIsGenerating(true);
    setStory(""); // Clear previous story

    try {
      const systemInstruction = `你是一位擅长描写校园科研生活、捕捉人物情感张力的同人小说家。
你正在创作一系列发生在【东南大学机械学院工业设计系】课题组的故事。

**核心场景 (The Stage):**
- **地点：** 东南大学 南高312室（这是大本营，几乎所有师生的工位都在这里）。
- **环境氛围：** 工科特有的氛围。桌上不仅有电脑、论文，还有各种设备。
- **专业特色：** 这是一个设计与工程的交叉学科，领域包括：计算机，人机交互，航空航天。

**人物资料库 (Character Database):**
请严格记住以下人物的阶级和关系，用于构建故事中的互动模式：

【BOSS 组】
1. **周小舟 (大导师/女/40+):** 性格：学术造诣高，严厉但有社交手腕，偶尔活泼。气场：掌握生杀大权，学生有点怕她，但又很敬佩她。
2. **余潇群 (小导师/男/30+):** 性格：和蔼可亲，耐心极好，技术/学术双强。功能：通常是学生们的“救命稻草”，负责解决具体难题，和学生关系更近。

【博士组 (老资历/压力大/大师兄姐)】
- 韩己臣 (男)、朱隽宇 (男)、王柏捷 (男)、巫明蓉 (女)、李翰林 (男)。
- *定位：* 实验室的中流砥柱，可能在带硕士，或者被毕业论文折磨。

【硕士·研三 (老油条/面临毕业/忙碌)】
- 蒋厚泽 (男)、陈诚 (男)、马一松 (男)、何雅怡 (女)、吴航 (女)、章雨昕 (女)。

【硕士·研二 (干活主力/最活跃)】
- 陈玲 (女)、黎若渝 (女)、马濛 (男)、吴佳庆 (男)、王志轩 (男)。

【硕士·研一 (萌新/打杂/充满希望或迷茫)】
- 郝宇森 (男)、陈嘉怡 (女)、虞逸凡 (女)、徐瑜增 (男)。

【本科 (团宠/甚至可能比研究生还强)】
- 巴程涛。

**写作规则 (Writing Rules):**
1. **阶级互动：** 研一通常对博士叫“师兄/师姐”，对导师毕恭毕敬。研三和博士之间可能更像战友。
2. **场景感：** 描写可以发生在“南高312”这个空间内，也可以自由发挥在任何占学术边的环境。
3. **CP感生成逻辑：** 
   - 当用户指定两个人名时，根据他们的身份（如：博士x研一，导师x学生，同年级x同年级）自动生成符合身份差距的张力。
   - 如果用户未指定具体性格（除了导师外），请根据常见的工科研究生人设进行合理脑补（如：熬夜秃头、吐槽狂魔、高冷学霸、笨蛋美人）。
4. **必须符合用户指定的文风（如：甜宠、虐心、搞笑）。**
5. **长度控制在 500 字左右。**
6. **不要输出多余的寒暄，直接输出小说正文。**`;

      const userPrompt = `
【人物A】：${personA}
【人物B】：${personB}
【文风】：${selectedStyle}
【设定/背景】：${setting || "自由发挥，但要基于南高312的科研生活日常"}
`;
      // 1. 发起请求
      const stream = await client.chat.completions.create({
        model: "qwen-plus", // 模型名称：qwen-plus (性价比高) 或 qwen-max (效果最好)
        messages: [
          { role: "system", content: systemInstruction }, // 把之前的 systemInstruction 放这里
          { role: "user", content: userPrompt }           // 把用户的输入放这里
        ],
        stream: true,     // 开启打字机流式效果
        temperature: 0.85 // 创意程度
      });

      // 2. 处理流式返回 (格式和Google不一样，所以要改)
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          setStory((prev) => prev + content);
        }
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setStory("生成失败，请稍后再试。\nError generating story. Please check your connection or API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      <style>{`
        .app-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .header {
          text-align: center;
          margin-bottom: 20px;
        }

        .header h1 {
          font-family: 'Noto Serif SC', serif;
          font-weight: 700;
          color: #2d3748;
          font-size: 2.2rem;
          margin: 0;
          background: linear-gradient(to right, #0052d4, #4364f7, #6fb1fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header p {
          color: #718096;
          margin-top: 10px;
          font-size: 1.1rem;
        }

        .sub-header {
            font-size: 0.9rem;
            color: #a0aec0;
            margin-top: 5px;
        }

        .input-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .row {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .col {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 8px;
        }

        /* Replaced text input styles with select styles */
        select, textarea {
          padding: 12px 16px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          background: #fff;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Nunito', sans-serif;
          width: 100%;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right .7em top 50%;
          background-size: .65em auto;
        }

        select:focus, textarea:focus {
          outline: none;
          border-color: #4364f7;
          box-shadow: 0 0 0 3px rgba(67, 100, 247, 0.1);
        }

        .style-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }

        .style-tag {
          padding: 8px 12px;
          border-radius: 8px;
          background: #edf2f7;
          color: #4a5568;
          font-size: 0.9rem;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .style-tag:hover {
          background: #e2e8f0;
        }

        .style-tag.selected {
          background: #ebf4ff;
          color: #4364f7;
          border-color: #4364f7;
          font-weight: 600;
        }

        .generate-btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #0052d4 0%, #4364f7 100%);
          color: white;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 4px 6px -1px rgba(67, 100, 247, 0.3);
        }

        .generate-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 10px -1px rgba(67, 100, 247, 0.4);
        }

        .generate-btn:active {
          transform: translateY(0);
        }

        .generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .output-section {
          position: relative;
          background: #fff;
          border-radius: 4px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          min-height: 300px;
          margin-top: 20px;
        }

        /* Paper effect */
        .output-paper {
          background-image: 
            linear-gradient(#f1f1f1 1px, transparent 1px), 
            linear-gradient(90deg, #f1f1f1 1px, transparent 1px);
          background-size: 20px 20px;
          background-color: #fffdf5; /* Cream paper color */
          padding: 40px;
          border-radius: 2px;
          min-height: 400px;
          position: relative;
        }

        .output-paper::before {
          content: '';
          position: absolute;
          top: 0; left: 40px; bottom: 0;
          width: 2px;
          background: rgba(255,0,0,0.1); /* Margin line */
        }

        .story-content {
          font-family: 'Noto Serif SC', serif;
          font-size: 1.15rem;
          line-height: 1.8;
          color: #2d3748;
          white-space: pre-wrap;
          padding-left: 20px; /* Offset for margin line */
        }

        .placeholder {
          text-align: center;
          color: #a0aec0;
          margin-top: 100px;
          font-style: italic;
        }

        @media (max-width: 600px) {
          .row { flex-direction: column; gap: 10px;}
        }
      `}</style>

      <div className="header">
        <h1>南高312 嗑学家</h1>
        <p>东南大学机械学院·工业设计系课题组</p>
        <div className="sub-header">Input two characters from the lab, and let AI write their story.</div>
      </div>

      <div className="input-card">
        <div className="row">
          <div className="col">
            <label>人物 A (Character A)</label>
            <select
              value={personA}
              onChange={(e) => setPersonA(e.target.value)}
            >
              <option value="">请选择角色...</option>
              {CHARACTER_GROUPS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.members.map((member) => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="col">
            <label>人物 B (Character B)</label>
            <select
              value={personB}
              onChange={(e) => setPersonB(e.target.value)}
            >
              <option value="">请选择角色...</option>
              {CHARACTER_GROUPS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.members.map((member) => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <label>文风 (Style)</label>
        <div className="style-grid">
          {STYLES.map((style) => (
            <div
              key={style}
              className={`style-tag ${selectedStyle === style ? "selected" : ""}`}
              onClick={() => setSelectedStyle(style)}
            >
              {style}
            </div>
          ))}
        </div>

        <div className="col" style={{ marginBottom: "20px" }}>
          <label>设定 / 梗 (Setting/Prompt)</label>
          <textarea
            rows={3}
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            placeholder="例如：通宵改论文时的一杯咖啡... / e.g. Late night thesis revision..."
          />
        </div>

        <button 
          className="generate-btn" 
          onClick={generateStory} 
          disabled={isGenerating}
        >
          {isGenerating ? "正在创作中... / Writing..." : "✨ 生成南高312故事 (Generate)"}
        </button>
      </div>

      <div className="output-section">
        <div className="output-paper" ref={outputRef}>
          {story ? (
            <div className="story-content">{story}</div>
          ) : (
            <div className="placeholder">
              {isGenerating ? "键盘敲击声渐起..." : "请选择两位课题组同门，开始嗑CP..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
