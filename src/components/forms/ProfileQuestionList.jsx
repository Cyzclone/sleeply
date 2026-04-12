import ProfileQuestionRow from "./ProfileQuestionRow";

export default function ProfileQuestionList({
  questions,
  answers,
  mode,
  onValueChange,
  onSkipChange,
  onEdit,
}) {
  return (
    <div className="sl-question-list">
      {questions.map((question) => (
        <ProfileQuestionRow
          key={question.id}
          answer={answers[question.id]}
          mode={mode}
          onEdit={onEdit}
          onSkipChange={onSkipChange}
          onValueChange={onValueChange}
          question={question}
        />
      ))}
    </div>
  );
}
