import { useRef, useState } from "react";
import {
  Button,
  Group,
  InputLabel,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import {
  Icon123,
  IconChevronDown,
  IconSquareRoundedXFilled,
  IconTrashXFilled,
  IconUpload,
} from "@tabler/icons-react";
import { verifyUser } from "../utilities/localStorage";
import { addQuestions } from "../utilities/api";
import PdfDownloader from "../utilities/PdfDownloader";
import toast from "react-hot-toast";

const Dashboard = () => {
  const uploadButtonRef = useRef(null);
  const [questionType, setQuestionType] = useState("");
  const [title, setTitle] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [rubrics, setRubrics] = useState([]);

  const handleTypeChange = (event) => {
    setQuestionType(event.target.value);
    setNumberOfQuestions(0);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setErrors({});
  };

  const handleInputChange = (event) => {
    const value = Math.min(10, Math.max(0, parseInt(event.target.value)));
    setNumberOfQuestions(value);
    const newQuestions = Array.from({ length: value }, (_, index) => ({
      id: index + 1,
      type: questionType,
      title: title,
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      marks: "",
      image: [],
    }));
    setQuestions(newQuestions);
    setCurrentQuestionIndex(0);
  };

  const handleUploadImage = (isRubric = false) => {
    const myWidget = window.cloudinary.createUploadWidget(
      {
        cloudName: "dfsxz5j91",
        uploadPreset: "klpnyo85",
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          const uploadedUrl = result.info.secure_url;
          const updatedQuestions = [...questions];
          const currentQuestion = updatedQuestions[currentQuestionIndex] || {};
          if (isRubric) {
            setRubrics(uploadedUrl);
          } else {
            currentQuestion.image = currentQuestion.image || [];
            currentQuestion.image.push(uploadedUrl);
          }

          setQuestions(updatedQuestions);
        }
      },
    );
    myWidget.open();
  };
  const handleQuestionChange = (index, event) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].question = event.target.value;
    setQuestions(updatedQuestions);

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[index];
      return newErrors;
    });
  };
  const handleOptionChange = (questionIndex, optionIndex, event) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = event.target.value;
    setQuestions(updatedQuestions);
  };
  const handleDeleteImage = (imageIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].image.splice(imageIndex, 1);
    setQuestions(updatedQuestions);
  };
  const handleCorrectAnswerChange = (index, event) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].correctAnswer = event.target.value;
    setQuestions(updatedQuestions);
  };
  const handleMarksChange = (index, event) => {
    const value = Math.min(100, Math.max(0, parseInt(event.target.value)));
    const newQuestions = [...questions];
    newQuestions[index].marks = value;
    setQuestions(newQuestions);
    setErrors({})

  };
  const validateQuestion = (index) => {
    const question = questions[index];
        if (question.type === "MCQ") {
      if (question.question === "") {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [index]: "Question cannot be empty",
        }));
        return false;
      } else if (question.options.some((option) => option.trim() === "")) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [index]: "All options must be filled",
        }));
        return false;
      } else if (question.correctAnswer.trim() === "") {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [index]: "Please select correct answer",
        }));
        return false;
      }
    } else if (question.type === "Paragraph") {
      if (title === "") {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [index]: "Please Enter title",
        }));
        return false;
      } else if (question.question === "") {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [index]: "Paragraph question cannot be empty",
        }));
        return false;
      }
      else if (question.marks === "") {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [index]: "Please Enter Marks",
        }));
        return false;
      }
    
    }
    return true;
  };
  const handleNextQuestion = () => {
    if (validateQuestion(currentQuestionIndex)) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      }
    }
  };
  const handleRemoveRubrics = () => {
    setRubrics([]);
  };
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
    }
  };
  const submitUserComment = (event) => {
    event.preventDefault();

    const isValid = questions.every((question, index) =>
      validateQuestion(index),
    );

    if (!isValid) {
      return;
    }
    const verifiedUser = verifyUser();
    const userId = verifiedUser?.user?._id;
    const userEmail = verifiedUser?.user?.email;
    const departments =
      verifiedUser?.departments?.departments || verifiedUser?.user?.departments;
    const questionData = { questions, userId, userEmail, departments, rubrics };
    addQuestions(questionData)
      .then((res) => {
        setNumberOfQuestions("");
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setErrors({});
        setTitle("");
        setRubrics([]);
        toast.success(res.data.message);
      })
      .catch((error) => {
        toast.error(error.response.data.errorMessage);
      });
  };
  return (
    <div className="question-paper">
      <Text tt="uppercase" size="xl">
        Create a question paper
      </Text>
      {errors[currentQuestionIndex] && (
        <div className="error">{errors[currentQuestionIndex]} </div>
      )}
      <Group grow mb="md" mt="md">
        <TextInput
          component="select"
          rightSection={<IconChevronDown size={14} stroke={1.5} />}
          pointer
          mt="md"
          id="questionType"
          value={questionType}
          onChange={handleTypeChange}
          label="Please Select a Question Type you want to Create : MCQ / Open Book"
        >
          <option value="">Select Type</option>
          <option value="MCQ">Multiple Choice Question (MCQ)</option>
          <option value="Paragraph">Open Book Exam</option>{" "}
        </TextInput>
      </Group>

      <Group grow mb="xl" mt="md">
        <InputLabel>Enter Question Paper title</InputLabel>
        <TextInput
          placeholder="Enter the question title"
          id="title"
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors({})
          }}
          required
          rightSection={<Icon123 size={16} />}
        />
      </Group>

      {questionType && (
        <form onSubmit={submitUserComment}>
          <Group justify="space-between" mb={4}>
            <div>
              {questionType === "Paragraph" && !rubrics?.length ? (
                <Button
                  fullWidth
                  id="uploadButton"
                  type="button"
                  value="Upload"
                  onClick={() => handleUploadImage(true)}
                  ref={uploadButtonRef}
                  color="lime"
                >
                  rubrics <IconUpload />
                </Button>
              ) : (
                <>Current Rubrics</>
              )}
            </div>
            {rubrics?.length > 0 ? (
              <Group justify="space-between" mb={4}>
                <PdfDownloader file={rubrics?.[0]} />
                <Button color="red" onClick={handleRemoveRubrics}>
                  <IconTrashXFilled />
                </Button>
              </Group>
            ) : (
              <> No rubrics uploaded yet</>
            )}
          </Group>
          <Group grow mb="xl" mt="md">
            <InputLabel>Number of Questions (max: 10):</InputLabel>

            <TextInput
              placeholder="Enter the number of questions"
              id="numberOfQuestions"
              type="number"
              name="numberOfQuestions"
              value={numberOfQuestions}
              onChange={handleInputChange}
              required
              rightSection={<Icon123 size={16} />}
            />
          </Group>

          {questions.length > 0 && (
            <div key={questions[currentQuestionIndex].id}>
              <Button
                fullWidth
                id="uploadButton"
                type="button"
                value="Upload"
                onClick={() => handleUploadImage(false)}
                ref={uploadButtonRef}
              >
                Upload Images
              </Button>
              {questions[currentQuestionIndex].image.length > 0 && (
                <div className="image-container">
                  {questions[currentQuestionIndex].image.map(
                    (imageUrl, index) => (
                      <section key={index} className="image-wrapper">
                        <img
                          src={imageUrl}
                          alt={`Uploaded ${index}`}
                          height={100}
                          width={100}
                          className="image"
                        />
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteImage(index)}
                        >
                          <IconSquareRoundedXFilled />
                        </button>
                      </section>
                    ),
                  )}
                </div>
              )}
              {questions[currentQuestionIndex].type === "MCQ" ? (
                <Textarea
                  variant="filled"
                  size="md"
                  radius="lg"
                  description={`Question No: ${currentQuestionIndex + 1}`}
                  placeholder="Enter Question"
                  value={questions[currentQuestionIndex].question}
                  onChange={(event) =>
                    handleQuestionChange(currentQuestionIndex, event)
                  }
                />
              ) : (
                <Textarea
                  variant="filled"
                  size="md"
                  radius="lg"
                  description={`Question No: ${currentQuestionIndex + 1}`}
                  placeholder="Enter Question"
                  value={questions[currentQuestionIndex].question}
                  onChange={(event) =>
                    handleQuestionChange(currentQuestionIndex, event)
                  }
                  rows={8}
                />
              )}

              {questions[currentQuestionIndex].type === "MCQ" && (
                <>
                  <Text>Options:</Text>
                  {questions[currentQuestionIndex].options.map(
                    (option, optionIndex) => (
                      <div key={optionIndex} className="options">
                        <h5 className="text-center">{optionIndex + 1}.</h5>
                        <TextInput
                          value={option}
                          variant="filled"
                          size="md"
                          radius="md"
                          placeholder={`Enter Option ${optionIndex + 1}`}
                          onChange={(event) =>
                            handleOptionChange(
                              currentQuestionIndex,
                              optionIndex,
                              event,
                            )
                          }
                        />
                        {errors[`${currentQuestionIndex}.${optionIndex}`] && (
                          <div className="error">
                            {errors[`${currentQuestionIndex}.${optionIndex}`]}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                  <label>
                    Correct Answer:
                    <TextInput
                      component="select"
                      rightSection={<IconChevronDown size={14} stroke={1.5} />}
                      pointer
                      mt="md"
                      value={questions[currentQuestionIndex].correctAnswer}
                      className="form-control"
                      onChange={(event) =>
                        handleCorrectAnswerChange(currentQuestionIndex, event)
                      }
                    >
                      <option value="" disabled>
                        Please select correct answer
                      </option>
                      {questions[currentQuestionIndex].options.map(
                        (option, optionIndex) => (
                          <option key={optionIndex} value={option}>
                            {option}
                          </option>
                        ),
                      )}
                    </TextInput>
                  </label>
                </>
              )}

              <Group grow mb="xl" mt="md">
                <InputLabel>Marks (Total should be: 100):</InputLabel>
                <TextInput
                  placeholder="Enter the number of mark per question"
                  type="number"
                  id="marks"
                  value={questions[currentQuestionIndex].marks}
                  onChange={(event) =>
                    handleMarksChange(currentQuestionIndex, event)
                  }
                  required
                  rightSection={<Icon123 size={16} />}
                />
              </Group>
            </div>
          )}

          {(currentQuestionIndex > 0 || questions.length > 1) && (
            <div className="all-buttons">
              {currentQuestionIndex > 0 && (
                <Button onClick={handlePreviousQuestion}>
                  Previous Question
                </Button>
              )}
              {currentQuestionIndex < questions.length - 1 && (
                <Button onClick={handleNextQuestion}>Next Question</Button>
              )}

              {currentQuestionIndex === questions.length - 1 && (
                <Button type="submit">Submit Questions</Button>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default Dashboard;
