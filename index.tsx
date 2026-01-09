import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";

import OpenAI from "openai";

// 初始化通义千问客户端
const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    dangerouslyAllowBrowser: true
});

// Refined Styles for "Shipping" (CP Culture)
const STYLES = [
  "甜宠 (Sweet/Fluff)",
  "极限拉扯 (Tension)",
  "双向暗恋 (Mutual Crush)",
  "相爱相杀 (Rivals to Lovers)",
  "修罗场 (Jealousy/Drama)",
  "破镜重圆 (Reunion)",
  "强强 (Power Couple)",
  "救赎 (Hurt/Comfort)",
  "年下/年上 (Age Gap)",
  "沙雕/搞笑 (Crack/Comedy)",
  "通宵赶图 (Late Night Lab)",
  "BE美学 (Tragedy)"
];

const WORD_COUNTS = [300, 500, 700, 1000];

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

// Helper to get all predefined names
const ALL_PREDEFINED_CHARS = CHARACTER_GROUPS.flatMap(g => g.members);

type CharacterInput = {
  id: string;
  name: string;
  isCustom: boolean;
};

const App = () => {
  // State for characters (dynamic list)
  const [characters, setCharacters] = useState<CharacterInput[]>([
    { id: '1', name: "", isCustom: false },
    { id: '2', name: "", isCustom: false }
  ]);
  
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [targetWordCount, setTargetWordCount] = useState(500);
  const [setting, setSetting] = useState("");
  const [story, setStory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState("复制 (Copy)");
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [story]);

  // Character management handlers
  const updateCharacter = (id: string, field: keyof CharacterInput, value: any) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addCharacter = () => {
    if (characters.length >= 5) {
      alert("最多支持 5 人同台飙戏 (Max 5 characters)");
      return;
    }
    setCharacters(prev => [...prev, { id: Date.now().toString(), name: "", isCustom: false }]);
  };

  const removeCharacter = (id: string) => {
    if (characters.length <= 2) return;
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  const handleRandomize = () => {
    // Pick 2 random unique characters from the predefined list
    const shuffled = [...ALL_PREDEFINED_CHARS].sort(() => 0.5 - Math.random());
    const randomChars = shuffled.slice(0, 2);
    
    // Pick random style
    const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)];

    setCharacters([
      { id: Date.now().toString() + '1', name: randomChars[0], isCustom: false },
      { id: Date.now().toString() + '2', name: randomChars[1], isCustom: false }
    ]);
    setSelectedStyle(randomStyle);
  };

  const generateStory = async () => {
    // Filter out empty names
    const activeCharacters = characters.filter(c => c.name.trim() !== "");

    if (activeCharacters.length < 2) {
      alert("至少需要两个角色才能产粮 / At least 2 characters required.");
      return;
    }

    setIsGenerating(true);
    setStory(""); 
    setCopyStatus("复制 (Copy)"); 

    try {
      const charListString = activeCharacters.map((c, idx) => `【人物 ${idx + 1}】：${c.name}`).join("\n");

      const systemInstruction = `你是一位擅长捕捉人物情感张力、描写细腻互动的同人文写手（嗑学家）。
你正在创作一系列发生在【东南大学机械学院工业设计系】课题组的故事。

**核心场景 (The Stage):**
- **地点：** 东南大学 南高312室（大本营）、实验室、校园周边。
- **环境氛围：** 充满生活气息的工科科研日常。半夜的泡面、改不完的论文、跑不通的代码、打印机的噪音。
- **专业特色：** 工业设计，涉及计算机、人机交互、美学。

**人物资料库 (Character Database):**
请严格记住以下人物的阶级和关系 (若用户输入了自定义角色，请根据名字气质将其自然融入群体)：

${JSON.stringify(CHARACTER_GROUPS)}

**写作核心要求 (Writing Guidelines):**
1.  **重“嗑”感，轻剧情：** 重点在于人物之间的**眼神交流、肢体接触、心理博弈、氛围拉扯**。不要写流水账，要写出那种“虽然他们没说，但由于都知道他们是一对”的暧昧感，或者“大家都看出来了就他俩不知道”的急切感。
2.  **人设还原：**
    *   **Boss组：** 气场强大，或者是温和的掌控者。
    *   **博士组：** 疲惫但可靠，学术压力大，可能带有那种“成熟大哥哥/大姐姐”的苏感。
    *   **硕士/本科：** 充满活力或清澈的愚蠢，被论文折磨的小狗感。
3.  **风格执行：** 严格执行【${selectedStyle}】。
    *   *极限拉扯：* 两人之间充满试探，进一退二。
    *   *修罗场：* 多人互动时，微妙的嫉妒、占有欲和站队。
    *   *强强：* 学术或能力上的势均力敌，互相欣赏又互不服输。
    *   *救赎：* 在科研压力崩溃时，唯一的那个避风港。
4.  **篇幅控制：** 目标字数在 **${targetWordCount}** 字左右。
5.  **拒绝OOC（Out Of Character）：** 保持符合东南大学工科生的行为逻辑，不要写成霸道总裁文。

**直接输出小说正文，无需标题和寒暄。**`;

      const userPrompt = `
${charListString}
【文风】：${selectedStyle}
【目标字数】：${targetWordCount}字
【设定/梗/Context】：${setting || "自由发挥，基于南高312日常的嗑糖瞬间"}
`;

// 3. 调用通义千问 API (这是和原来最大的不同点)
      const stream = await client.chat.completions.create({
        model: "qwen-plus", // 使用通义千问 Plus 模型
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        stream: true, // 开启流式输出
        temperature: 0.95, // 保持高创造性
      });

      // 4. 处理流式返回结果
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

  const handleCopy = async () => {
    if (!story) return;
    try {
      await navigator.clipboard.writeText(story);
      setCopyStatus("已复制！(Copied)");
      setTimeout(() => setCopyStatus("复制 (Copy)"), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleShare = async () => {
    if (!story) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: '南高312 CP文',
          text: story,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      handleCopy();
      alert("您的浏览器不支持直接分享，已自动复制到剪贴板。");
    }
  };

  return (
    <div className="app-container">
      <style>{`
        .app-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 25px;
          min-height: 100vh;
        }

        .header {
          text-align: center;
          margin-bottom: 5px;
        }

        .header h1 {
          font-family: 'Noto Serif SC', serif;
          font-weight: 700;
          color: #2d3748;
          font-size: 2rem;
          margin: 0;
          background: linear-gradient(to right, #0052d4, #4364f7, #6fb1fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header p {
          color: #718096;
          margin-top: 8px;
          font-size: 1rem;
          font-weight: 600;
        }

        .input-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .section-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #4a5568;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Character Rows */
        .char-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .char-row {
          display: flex;
          gap: 8px;
          align-items: center;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .char-input-group {
          flex: 1;
          display: flex;
          gap: 8px;
        }

        select, input[type="text"], textarea {
          padding: 10px 14px;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
          background: #fff;
          font-size: 0.95rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Nunito', sans-serif;
          width: 100%;
          box-sizing: border-box;
        }
        
        select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right .7em top 50%;
          background-size: .65em auto;
        }

        select:focus, input:focus, textarea:focus {
          outline: none;
          border-color: #4364f7;
          box-shadow: 0 0 0 3px rgba(67, 100, 247, 0.1);
        }

        .icon-btn {
          background: none;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          width: 40px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.1rem;
          color: #718096;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .icon-btn:hover {
          background: #edf2f7;
          color: #4a5568;
        }

        .icon-btn.active {
          background: #ebf4ff;
          color: #4364f7;
          border-color: #4364f7;
        }
        
        .char-actions {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .text-btn {
          background: none;
          border: none;
          color: #4364f7;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 6px;
        }
        
        .text-btn:hover {
          background: #ebf4ff;
        }

        .style-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
          margin-bottom: 20px;
        }

        .style-tag {
          padding: 8px 4px;
          border-radius: 8px;
          background: #edf2f7;
          color: #4a5568;
          font-size: 0.85rem;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
          border: 1px solid transparent;
          user-select: none;
        }

        .style-tag:hover {
          background: #e2e8f0;
        }

        .style-tag.selected {
          background: #ebf4ff;
          color: #4364f7;
          border-color: #4364f7;
          font-weight: 700;
          box-shadow: 0 2px 4px rgba(67, 100, 247, 0.1);
        }
        
        /* Word Count Selector */
        .length-selector {
          display: flex;
          background: #edf2f7;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 20px;
        }
        
        .length-option {
          flex: 1;
          text-align: center;
          padding: 8px;
          border-radius: 8px;
          font-size: 0.85rem;
          cursor: pointer;
          color: #718096;
          transition: all 0.2s;
        }
        
        .length-option.selected {
          background: white;
          color: #2d3748;
          font-weight: 700;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .generate-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #0052d4 0%, #4364f7 100%);
          color: white;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 4px 6px -1px rgba(67, 100, 247, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .generate-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 10px -1px rgba(67, 100, 247, 0.4);
        }

        .generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .output-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Paper effect */
        .output-paper {
          background-image: 
            linear-gradient(#f1f1f1 1px, transparent 1px), 
            linear-gradient(90deg, #f1f1f1 1px, transparent 1px);
          background-size: 20px 20px;
          background-color: #fffdf5; /* Cream paper color */
          padding: 30px 20px;
          border-radius: 8px;
          min-height: 350px;
          max-height: 60vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }

        .output-paper::before {
          content: '';
          position: absolute;
          top: 0; left: 30px; bottom: 0;
          width: 2px;
          background: rgba(255,0,0,0.05); /* Margin line */
        }

        .story-content {
          font-family: 'Noto Serif SC', serif;
          font-size: 1.1rem;
          line-height: 1.8;
          color: #2d3748;
          white-space: pre-wrap;
          padding-left: 20px; /* Offset for margin line */
        }

        .placeholder {
          text-align: center;
          color: #a0aec0;
          margin-top: 80px;
          font-style: italic;
          padding-left: 0;
        }

        .toolbar {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .tool-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #4a5568;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .tool-btn.primary {
          color: #4364f7;
          border-color: #4364f7;
        }

        .footer {
          text-align: center;
          color: #a0aec0;
          font-size: 0.8rem;
          margin-top: auto;
          padding-top: 20px;
        }

        @media (max-width: 600px) {
          .app-container { padding: 15px; }
          .header h1 { font-size: 1.6rem; }
          .style-grid { grid-template-columns: repeat(3, 1fr); }
          .output-paper { padding: 20px 15px; }
          .output-paper::before { left: 20px; }
          .story-content { font-size: 1rem; padding-left: 15px; }
        }
      `}</style>

      <div className="header">
        <h1>南高312 嗑学家</h1>
        <p>东南大学机械学院 · 工业设计系课题组</p>
      </div>

      <div className="input-card">
        <div className="section-label">
          <span>角色列表 (Characters)</span>
          <span style={{fontSize: '0.75rem', fontWeight: 400, color: '#a0aec0'}}>
            {characters.length} / 5
          </span>
        </div>
        
        <div className="char-list">
          {characters.map((char, index) => (
            <div key={char.id} className="char-row">
              <div className="char-input-group">
                {char.isCustom ? (
                   <input
                     type="text"
                     value={char.name}
                     onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                     placeholder={`输入自定义角色名 ${index + 1}...`}
                     autoFocus
                   />
                ) : (
                  <select
                    value={char.name}
                    onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                  >
                    <option value="">选择角色 Select...</option>
                    {CHARACTER_GROUPS.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.members.map((member) => (
                          <option key={member} value={member}>{member}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </div>
              
              <button 
                className={`icon-btn ${char.isCustom ? 'active' : ''}`}
                onClick={() => updateCharacter(char.id, 'isCustom', !char.isCustom)}
                title="切换自定义输入 / Toggle Custom Input"
              >
                {char.isCustom ? '✏️' : '📋'}
              </button>

              {characters.length > 2 && (
                <button 
                  className="icon-btn" 
                  style={{color: '#e53e3e', borderColor: '#feb2b2'}}
                  onClick={() => removeCharacter(char.id)}
                  title="Remove"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="char-actions">
          <button className="text-btn" onClick={addCharacter}>
            ➕ 添加角色 (Add)
          </button>
          <button className="text-btn" onClick={handleRandomize}>
            🎲 随机配置 (Random)
          </button>
        </div>

        <div className="section-label">嗑学风味 (Flavor)</div>
        <div className="style-grid">
          {STYLES.map((style) => (
            <div
              key={style}
              className={`style-tag ${selectedStyle === style ? "selected" : ""}`}
              onClick={() => setSelectedStyle(style)}
            >
              {style.split(' ')[0]}
            </div>
          ))}
        </div>

        <div className="section-label">粮仓储备 (Length)</div>
        <div className="length-selector">
          {WORD_COUNTS.map((count) => (
            <div 
              key={count}
              className={`length-option ${targetWordCount === count ? 'selected' : ''}`}
              onClick={() => setTargetWordCount(count)}
            >
              {count}字
            </div>
          ))}
        </div>

        <div className="section-label">梗 / 设定 (Prompt - Optional)</div>
        <textarea
            rows={2}
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            placeholder="例如：在312因为一个bug吵起来了... / e.g. Arguing over a bug in 312..."
            style={{marginBottom: '20px'}}
        />

        <button 
          className="generate-btn" 
          onClick={generateStory} 
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="spinner">✨</span> 正在产粮中...
            </>
          ) : "🖋️ 开始产粮 (Generate)"}
        </button>
      </div>

      <div className="output-section">
        {story && (
          <div className="toolbar">
             <button className="tool-btn" onClick={handleShare}>
              📤 分享 Share
            </button>
            <button className="tool-btn primary" onClick={handleCopy}>
              📋 {copyStatus}
            </button>
          </div>
        )}
        
        <div className="output-paper" ref={outputRef}>
          {story ? (
            <div className="story-content">{story}</div>
          ) : (
            <div className="placeholder">
              {isGenerating ? (
                <div>
                   <p>AI 正在检索人物性格...</p>
                   <p>正在构思南高312的场景...</p>
                </div>
              ) : "请选择同门（支持多人、自定义），点击生成..."}
            </div>
          )}
        </div>
      </div>

      <div className="footer">
        ⚠️ 本故事由 AI 生成，纯属虚构，请勿上升蒸煮。<br/>
        Made for SEU Industrial Design Lab
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
