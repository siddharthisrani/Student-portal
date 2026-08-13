"use client";

import MCQPlayer from "../player/MCQPlayer";
import CodingPlayer from "../player/CodingPlayer";
import TextPlayer from "../player/TextPlayer";
import SQLPlayer from "../player/SQLPlayer";
import ExcelPlayer from "../player/ExcelPlayer";
// import UploadPlayer from "../../../../UploadPlayer";
import { motion } from "framer-motion";

interface Props {
  question: any;

  answer: any;

  onAnswerChange: (
    value: any
  ) => void;
}

export default function QuestionRenderer({
  question,
  answer,
  onAnswerChange,
}: Props) {

    console.log("Question Type:", question.type);

 switch (question.type) {

case "mcq":

case "image_mcq":

case "pdf_mcq":

return <MCQPlayer
  question={question}
  value={answer}
  onChange={
    onAnswerChange
  }
/>

case "coding":

return <CodingPlayer
  question={question}
  value={answer}
  onChange={
    onAnswerChange
  }
/>;

case "text":

return <TextPlayer question={question} value={answer}
  onChange={
    onAnswerChange
  }/>;

  case "sql":
  return (
    <SQLPlayer
      question={question}
      value={answer}
      onChange={onAnswerChange}
    />
  );

  case "excel":
  return (
    <ExcelPlayer
      question={question}
      value={answer}
      onChange={(value) =>
        onAnswerChange(value)
      }
    />
  );

default:

return (

<div>

Coming Soon

</div>

);

}

}