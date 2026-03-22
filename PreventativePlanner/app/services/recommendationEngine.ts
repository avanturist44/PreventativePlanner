export type UserProfile = {
  age: number;
  sex: string;
  riskFactors: string[];
};

export type Recommendation = {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  status: "upcoming" | "completed";
  explanation: string;
};

function nextYearDate(): string{
  const date = new Date();
  date.setFullYear(date.getFullYear()+1);
  return date.toISOString().split("T")[0];
}

export function generateRecommendations(userProfile: UserProfile): Recommendation[] {
  const recommendations: Recommendation[]=[];
  const{age, sex, riskFactors} = userProfile;

  if (age>= 50){
    recommendations.push({
      id: "colon_screening",
      title: "Colon Cancer Screening",
      category: "Screening",
      dueDate: nextYearDate(),
      status: "upcoming",
      explanation: "Recommended for adults age 50 and older"
    });
  }

  if (sex.toLowerCase() === "female" && age >= 40){
    recommendations.push({
      id: "mammogram",
      title: "Mammogram",
      category: "Screening",
      dueDate: nextYearDate(),
      status:"upcoming",
      explanation: "Recommended for women age 40 and older",
    });
  }

  if(riskFactors.includes("smoke")){
    recommendations.push({
      id: "lung_screening",
      title: "Lung Cancer Screening",
      category: "Screening",
      dueDate: nextYearDate(),
      status: "upcoming",
      explanation: "People with smoking history may have increase lung cancer risk",
    });
  }

  if(age>=18){
    recommendations.push({
      id:"annual_checkup",
      title:"Annual Physical Checkup",
      category:"Checkup",
      dueDate: nextYearDate(),
      status: "upcoming",
      explanation:"Routine annual checkup for adults to monitor health",
    });
  }

  return recommendations;
}