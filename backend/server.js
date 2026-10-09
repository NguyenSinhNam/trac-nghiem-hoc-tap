require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI, Type } = require("@google/genai");

const app = express();
const PORT = 3000;

// ===============================
// KẾT NỐI GEMINI
// ===============================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());

// ===============================
// API TẠO QUIZ
// ===============================

function shuffleArray(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] =
            [result[j], result[i]];
    }

    return result;
}

app.get("/api/quiz", async (req, res) => {

    const randomSeed =
    `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    const subject = req.query.subject;

    // Kiểm tra subject
    if (!subject) {
        return res.status(400).json({
            error: "Thiếu subject"
        });
    }

    if (
        subject !== "toan" &&
        subject !== "tieng-viet"
    ) {
        return res.status(400).json({
            error: "Subject không hợp lệ"
        });
    }

    try {

        let prompt = "";

        // ===============================
        // TOÁN
        // ===============================

        if (subject === "toan") {

            prompt = `
              Hãy tạo 20 câu hỏi trắc nghiệm Toán dành cho học sinh lớp 2.

              Mã ngẫu nhiên của lần tạo này:
              ${randomSeed}

              Mỗi lần tạo phải tạo một bộ câu hỏi mới.
              Không được sao chép nguyên câu hỏi từ các lần tạo trước.
              Câu hỏi tiếng việt có dấu.

              Yêu cầu:

              - Phù hợp học sinh lớp 2.
              - Nội dung thuộc chương trình học kỳ 1.
              - Phép cộng có nhớ trong phạm vi 100.
              - Phép trừ có nhớ trong phạm vi 100.
              - So sánh số.
              - Tìm số chưa biết.
              - Bài toán có lời văn đơn giản.
              - Các câu hỏi phải đa dạng.
              - Các số trong phép tính cần thay đổi.
              - Không sử dụng cùng một dạng số cho tất cả câu.
              - Không tạo câu hỏi quá khó.

              Mỗi câu:
              - Có đúng 4 đáp án.
              - Chỉ có 1 đáp án đúng.
              - Đáp án đúng phải phù hợp với đề bài, không cho đáp án sai so với đề.
              - dap_an_dung phải giống chính xác một phần tử của lua_chon.

              Đặc biệt:
              - Không để tất cả đáp án đúng ở cùng một vị trí.
              - Nội dung 20 câu phải khác nhau.
              - Không lặp lại câu hỏi trong cùng một bộ.

              Chỉ trả về JSON theo schema.
              `;
        }

        // ===============================
        // TIẾNG VIỆT
        // ===============================

        if (subject === "tieng-viet") {

            prompt = `
              Hãy tạo 20 câu hỏi trắc nghiệm Tiếng Việt dành cho học sinh lớp 2.

              Mã ngẫu nhiên của lần tạo này:
              ${randomSeed}

              Mỗi lần tạo phải tạo một bộ câu hỏi mới.
              Không được sao chép nguyên câu hỏi từ các lần tạo trước.
              Câu hỏi tiếng việt có dấu.

              Yêu cầu:

              - Phù hợp học sinh lớp 2.
              - Nội dung thuộc chương trình học kỳ 1.
              - Chính tả.
              - Từ chỉ sự vật.
              - Từ chỉ hoạt động.
              - Từ chỉ đặc điểm.
              - Câu.
              - Chọn từ thích hợp.
              - Dấu câu.
              - Từ trái nghĩa và đồng nghĩa đơn giản.
              - Đọc hiểu ngắn.
              - Các câu hỏi phải đa dạng.

              Mỗi câu:
              - Có đúng 4 đáp án.
              - Chỉ có 1 đáp án đúng.
              - Đáp án đúng phải phù hợp với đề bài, không cho đáp án sai so với đề.
              - dap_an_dung phải giống chính xác một phần tử của lua_chon.

              Đặc biệt:
              - Không để tất cả đáp án đúng ở cùng một vị trí.
              - Nội dung 20 câu phải khác nhau.
              - Không lặp lại câu hỏi trong cùng một bộ.

              Chỉ trả về JSON theo schema.
              `;
        }

        // ===============================
        // GỌI GEMINI
        // ===============================

        const response = await ai.models.generateContent({

            model: "gemini-3.5-flash-lite",

            contents: prompt,

            config: {

                responseMimeType: "application/json",

                responseSchema: {

                    type: Type.OBJECT,

                    properties: {

                        questions: {

                            type: Type.ARRAY,

                            items: {

                                type: Type.OBJECT,

                                properties: {

                                    cau_hoi: {
                                        type: Type.STRING
                                    },

                                    lua_chon: {

                                        type: Type.ARRAY,

                                        items: {
                                            type: Type.STRING
                                        }
                                    },

                                    dap_an_dung: {
                                        type: Type.STRING
                                    }

                                },

                                required: [
                                    "cau_hoi",
                                    "lua_chon",
                                    "dap_an_dung"
                                ]
                            }
                        }

                    },

                    required: [
                        "questions"
                    ]
                }
            }
        });

        // ===============================
        // ĐỌC JSON TỪ GEMINI
        // ===============================

        const data = JSON.parse(response.text);

        // Xáo trộn thứ tự câu hỏi
        data.questions = shuffleArray(data.questions);

        // Xáo trộn 4 đáp án của từng câu
        data.questions = data.questions.map(question => {

            const dapAnDung = question.dap_an_dung;

            question.lua_chon =
                shuffleArray(question.lua_chon);

            // Đảm bảo đáp án đúng vẫn tồn tại
            if (!question.lua_chon.includes(dapAnDung)) {
                throw new Error(
                    "Đáp án đúng không tồn tại trong danh sách đáp án"
                );
            }

            return question;
        });

        // ===============================
        // KIỂM TRA DỮ LIỆU
        // ===============================

        if (
            !data.questions ||
            !Array.isArray(data.questions)
        ) {

            throw new Error(
                "Gemini không trả về questions dạng array"
            );
        }

        // Kiểm tra từng câu
        data.questions.forEach((question, index) => {

            if (!question.cau_hoi) {
                throw new Error(
                    `Câu ${index + 1} thiếu cau_hoi`
                );
            }

            if (
                !Array.isArray(question.lua_chon) ||
                question.lua_chon.length !== 4
            ) {
                throw new Error(
                    `Câu ${index + 1} không có đúng 4 đáp án`
                );
            }

            if (
                !question.lua_chon.includes(
                    question.dap_an_dung
                )
            ) {
                throw new Error(
                    `Câu ${index + 1}: dap_an_dung không nằm trong lua_chon`
                );
            }
        });

        console.log(
            `Gemini đã tạo ${data.questions.length} câu ${subject}`
        );

        // ===============================
        // TRẢ JSON VỀ FRONTEND
        // ===============================

        res.json(data.questions);

    } catch (error) {

        console.error(
            "Gemini Error:",
            error
        );

        res.status(500).json({

            error:
                error.message ||
                "Không thể tạo câu hỏi từ Gemini"

        });
    }

});

// ===============================
// KHỞI ĐỘNG SERVER
// ===============================

app.listen(PORT, () => {

    console.log(
        `Backend đang chạy tại http://localhost:${PORT}`
    );

});