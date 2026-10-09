function speakText(text) {

    if (!("speechSynthesis" in window)) {
        alert("Trình duyệt của bạn không hỗ trợ đọc văn bản.");
        return;
    }

    const synth = window.speechSynthesis;

    // Dừng giọng đọc trước đó
    synth.cancel();

    const voices = synth.getVoices();

    // Tìm giọng tiếng Việt
    const vietnameseVoice = voices.find(voice =>
        voice.lang.toLowerCase() === "vi-vn"
    );

    const utterance =
        new SpeechSynthesisUtterance(text);

    // Ưu tiên voice tiếng Việt
    if (vietnameseVoice) {
        utterance.voice = vietnameseVoice;
        utterance.lang = "vi-VN";
    } else {
        utterance.lang = "vi-VN";
    }

    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;

    synth.speak(utterance);
}

speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();

    console.log(speechSynthesis.getVoices());
};



// ========================================
// XÁC ĐỊNH TRANG HIỆN TẠI
// ========================================

const currentPage = window.location.pathname.toLowerCase();

let questions = [];

const questionsContainer =
    document.getElementById("questionsContainer");

const quizForm =
    document.getElementById("quizForm");

const result =
    document.getElementById("result");


// ========================================
// XÁC ĐỊNH MÔN HỌC
// ========================================

function getSubject() {

    if (currentPage.includes("toan")) {
        return "toan";
    }

    if (currentPage.includes("tieng-viet")) {
        return "tieng-viet";
    }

    return null;
}


// ========================================
// TẢI CÂU HỎI TỪ GEMINI
// ========================================

async function loadQuiz() {

    const subject = getSubject();

    if (!subject) {
        return;
    }

    try {

        // Xóa kết quả cũ
        result.innerHTML = "";

        // Hiển thị loading
        questionsContainer.innerHTML = `
            <div style="
                text-align:center;
                padding:50px;
                font-size:18px;
            ">
                🤖 AI đang tạo bài tập...
            </div>
        `;

        // Gọi Backend
        const response = await fetch(
            `/api/quiz?subject=${subject}`
        );

        if (!response.ok) {

            const errorData =
                await response.json().catch(() => null);

            throw new Error(
                errorData?.error ||
                "Không thể lấy dữ liệu từ Backend"
            );
        }

        const data = await response.json();

        console.log("JSON từ Gemini:", data);

        // Kiểm tra JSON
        if (!Array.isArray(data)) {

            throw new Error(
                "Dữ liệu câu hỏi không phải là mảng"
            );
        }

        questions = data;

        // Hiển thị câu hỏi
        renderQuestions();

    } catch (error) {

        console.error("Lỗi:", error);

        questionsContainer.innerHTML = `
            <div style="
                text-align:center;
                padding:40px;
                color:#dc2626;
            ">

                <h3>❌ Không thể tải bài tập</h3>

                <p>
                    ${error.message}
                </p>

                <button
                    type="button"
                    onclick="loadQuiz()"
                    class="btn btn-primary"
                >
                    🔄 Thử lại
                </button>

            </div>
        `;
    }
}


// ========================================
// HIỂN THỊ CÂU HỎI
// ========================================

function renderQuestions() {

    questionsContainer.innerHTML = "";

    questions.forEach((question, index) => {

        // --------------------------------
        // QUESTION CARD
        // --------------------------------

        const questionCard =
            document.createElement("div");

        questionCard.className = "question-card";


        // --------------------------------
        // TIÊU ĐỀ CÂU HỎI
        // --------------------------------

        const questionTitle =
            document.createElement("h3");

        questionTitle.className = "question-text";


        // Số câu
        const questionNumber =
            document.createElement("span");

        questionNumber.className =
            "question-number";

        questionNumber.textContent =
            `Câu ${index + 1}`;


        // Nội dung câu hỏi
        const questionContent =
            document.createElement("span");

        questionContent.className =
            "question-content";

        questionContent.textContent =
            question.cau_hoi;


        // --------------------------------
        // NÚT ĐỌC CÂU HỎI
        // --------------------------------

        const speakButton =
            document.createElement("button");

        speakButton.type = "button";

        speakButton.className =
            "speak-question";

        speakButton.innerHTML = "🔊";

        speakButton.title =
            "Nghe câu hỏi";

        speakButton.setAttribute(
            "aria-label",
            "Đọc câu hỏi"
        );


        speakButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                speakText(question.cau_hoi);

            }
        );


        // --------------------------------
        // GHÉP TIÊU ĐỀ
        // --------------------------------

        questionTitle.appendChild(
            questionNumber
        );

        questionTitle.appendChild(
            questionContent
        );

        questionTitle.appendChild(
            speakButton
        );


        questionCard.appendChild(
            questionTitle
        );


        // --------------------------------
        // DANH SÁCH ĐÁP ÁN
        // --------------------------------

        const answers =
            document.createElement("div");

        answers.className = "answers";


        question.lua_chon.forEach(
            (option, optionIndex) => {

                const label =
                    document.createElement("label");

                label.className =
                    "answer-option";


                const input =
                    document.createElement("input");

                input.type = "radio";

                input.name =
                    `question-${index}`;

                input.value =
                    option;


                const text =
                    document.createElement("span");

                text.textContent =
                    option;


                label.appendChild(input);

                label.appendChild(text);

                answers.appendChild(label);

            }
        );


        // --------------------------------
        // THÊM ĐÁP ÁN VÀO CARD
        // --------------------------------

        questionCard.appendChild(
            answers
        );


        // --------------------------------
        // THÊM CARD VÀO CONTAINER
        // --------------------------------

        questionsContainer.appendChild(
            questionCard
        );

    });
}


// ========================================
// NỘP BÀI - CHẤM ĐIỂM
// ========================================

if (quizForm) {

    quizForm.addEventListener(
        "submit",
        function (event) {

            // Không reload trang
            event.preventDefault();


            // --------------------------------
            // KIỂM TRA CÓ CÂU HỎI HAY KHÔNG
            // --------------------------------

            if (!questions.length) {

                alert(
                    "Chưa có câu hỏi để chấm điểm."
                );

                return;
            }


            // --------------------------------
            // BIẾN ĐẾM
            // --------------------------------

            let score = 0;

            let answered = 0;

            let wrong = 0;


            // --------------------------------
            // CHẤM TỪNG CÂU
            // --------------------------------

            questions.forEach(
                (question, index) => {

                    const selected =
                        document.querySelector(
                            `input[name="question-${index}"]:checked`
                        );


                    // Có trả lời
                    if (selected) {

                        answered++;

                        // Đúng
                        if (
                            selected.value ===
                            question.dap_an_dung
                        ) {

                            score++;

                        } else {

                            wrong++;
                        }
                    }


                    // --------------------------------
                    // TÔ MÀU ĐÁP ÁN
                    // --------------------------------

                    const options =
                        document.querySelectorAll(
                            `input[name="question-${index}"]`
                        );


                    options.forEach(input => {

                        const label =
                            input.closest(
                                ".answer-option"
                            );


                        if (!label) {
                            return;
                        }


                        // Xóa class cũ
                        label.classList.remove(
                            "correct",
                            "wrong"
                        );


                        // Đáp án đúng
                        if (
                            input.value ===
                            question.dap_an_dung
                        ) {

                            label.classList.add(
                                "correct"
                            );
                        }


                        // Đáp án người dùng chọn nhưng sai
                        if (
                            selected &&
                            input.checked &&
                            input.value !==
                                question.dap_an_dung
                        ) {

                            label.classList.add(
                                "wrong"
                            );
                        }

                    });

                }
            );


            // --------------------------------
            // TÍNH SỐ CÂU CHƯA LÀM
            // --------------------------------

            const unanswered =
                questions.length - answered;


            // --------------------------------
            // TÍNH PHẦN TRĂM
            // --------------------------------

            const percentage =
                Math.round(
                    (score / questions.length) * 100
                );


            // --------------------------------
            // HIỂN THỊ KẾT QUẢ
            // --------------------------------

            showResult(
                score,
                wrong,
                answered,
                unanswered,
                percentage
            );


            // --------------------------------
            // KHÓA ĐÁP ÁN
            // --------------------------------

            const inputs =
                quizForm.querySelectorAll(
                    "input[type='radio']"
                );


            inputs.forEach(input => {

                input.disabled = true;

            });


            // --------------------------------
            // KHÓA NÚT NỘP
            // --------------------------------

            const submitButton =
                quizForm.querySelector(
                    "button[type='submit']"
                );


            if (submitButton) {

                submitButton.disabled = true;

                submitButton.textContent =
                    "✓ Đã nộp bài";
            }

        }
    );

}


// ========================================
// HIỂN THỊ KẾT QUẢ
// ========================================

function showResult(
    score,
    wrong,
    answered,
    unanswered,
    percentage
) {
    result.style.display = "block";

    let message = "";

    if (percentage === 100) {

        message =
            "🎉 Xuất sắc! Gin đã trả lời đúng tất cả!";

    } else if (percentage >= 80) {

        message =
            "👏 Rất tốt! Gin tiếp tục cố gắng!";

    } else if (percentage >= 60) {

        message =
            "👍 Khá tốt! Gin có thể làm tốt hơn nữa!";

    } else {

        message =
            "💪 Hãy ôn lại bài và thử lại nhé!";
    }


    result.innerHTML = `
        <div class="result-box">

            <h2>📊 Kết quả bài làm</h2>

            <div class="result-score">
                ${score}/${questions.length}
            </div>

            <p class="result-message">
                ${message}
            </p>

            <div class="result-details">

                <div>
                    <strong>${answered}</strong>
                    <span>Đã làm</span>
                </div>

                <div>
                    <strong>${score}</strong>
                    <span>Đúng</span>
                </div>

                <div>
                    <strong>${wrong}</strong>
                    <span>Sai</span>
                </div>

                <div>
                    <strong>${unanswered}</strong>
                    <span>Chưa làm</span>
                </div>

            </div>

            <div class="result-percentage">
                🎯 Điểm: ${percentage}%
            </div>

        </div>
    `;


    // Cuộn tới kết quả
    result.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}

// =========================================
// ĐỒNG HỒ ĐẾM NGƯỢC 15 PHÚT
// =========================================

let timerInterval = null;

const TOTAL_TIME = 15 * 60; // 15 phút
const WARNING_TIME = 3 * 60; // cảnh báo khi còn 3 phút

function startQuizTimer() {
    const timer = document.getElementById("quizTimer");
    const timerDisplay = document.getElementById("timerDisplay");
    const timerWarning = document.getElementById("timerWarning");

    if (!timer || !timerDisplay) return;

    let remainingTime = TOTAL_TIME;

    function updateTimer() {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;

        timerDisplay.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

        // ==============================
        // CÒN 3 PHÚT
        // ==============================
        if (remainingTime <= WARNING_TIME && remainingTime > 0) {
            timer.classList.add("warning");

            if (timerWarning) {
                timerWarning.classList.add("show");
            }
        }

        // ==============================
        // CÒN 1 PHÚT
        // ==============================
        if (remainingTime <= 60 && remainingTime > 0) {
            timer.classList.remove("warning");
            timer.classList.add("danger");

            if (timerWarning) {
                timerWarning.textContent =
                    "🔴 Chỉ còn 1 phút! Hãy hoàn thành bài và nộp bài.";
            }
        }

        // ==============================
        // HẾT GIỜ
        // ==============================
        if (remainingTime <= 0) {
            clearInterval(timerInterval);

            timerDisplay.textContent = "00:00";

            timer.classList.remove("warning");
            timer.classList.add("danger", "expired");

            if (timerWarning) {
                timerWarning.classList.add("show");
                timerWarning.textContent =
                    "⛔ Đã hết thời gian! Bài làm đang được nộp.";
            }

            // Tự động nộp bài
            if (quizForm) {
                quizForm.requestSubmit();
            }

            return;
        }

        remainingTime--;
    }

    // Hiển thị ngay 15:00
    updateTimer();

    // Sau đó cập nhật mỗi giây
    timerInterval = setInterval(updateTimer, 1000);
}


document.addEventListener("DOMContentLoaded", function () {

    const loginModal = document.getElementById("loginModal");
    const loginButton = document.getElementById("loginButton");
    const loginClose = document.getElementById("loginClose");
    const userNameInput = document.getElementById("userNameInput");
    const loginError = document.getElementById("loginError");

    const displayUserName = document.getElementById("displayUserName");
    const userGreeting = document.getElementById("userGreeting");
    const changeUserButton = document.getElementById("changeUserButton");

    // Lấy tên đã lưu
    const savedName = localStorage.getItem("quizUserName");

    // Nếu đã có tên
    if (savedName) {
        if (displayUserName) {
            displayUserName.textContent = savedName;
        }

        if (userGreeting) {
            userGreeting.style.display = "flex";
        }

        if (loginModal) {
            loginModal.classList.remove("show");
        }
    } else {
        // Chưa có tên → mở popup
        if (loginModal) {
            loginModal.classList.add("show");
        }

        if (userGreeting) {
            userGreeting.style.display = "none";
        }
    }

    // Bắt đầu học
    if (loginButton) {
        loginButton.addEventListener("click", function () {

            const name = userNameInput.value.trim();

            if (!name) {
                loginError.textContent = "Vui lòng nhập tên của bạn!";
                userNameInput.focus();
                return;
            }

            // Lưu tên vào LocalStorage
            localStorage.setItem("quizUserName", name);

            // Hiển thị tên
            if (displayUserName) {
                displayUserName.textContent = name;
            }

            if (userGreeting) {
                userGreeting.style.display = "flex";
            }

            // Đóng popup
            loginModal.classList.remove("show");

            loginError.textContent = "";
        });
    }

    // Nhấn Enter trong ô nhập tên
    if (userNameInput) {
        userNameInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                loginButton.click();
            }
        });
    }

    // Đổi tên
    if (changeUserButton) {
        changeUserButton.addEventListener("click", function () {

            userNameInput.value =
                localStorage.getItem("quizUserName") || "";

            loginModal.classList.add("show");

            setTimeout(function () {
                userNameInput.focus();
            }, 100);
        });
    }

});


// ========================================
// BẮT ĐẦU
// ========================================

loadQuiz().then(() => {
    startQuizTimer();
});