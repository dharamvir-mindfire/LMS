import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Courses from '../screens/Courses';
import CourseSubjects from '../screens/CourseSubjects';
import SubjectQuizzes from '../screens/SubjectQuizzes';

export type CoursesStackParamList = {
  Courses: undefined;
  CourseSubjects: {courseId: string; courseTitle: string};
  SubjectQuizzes: {subjectId: string; subjectName: string};
};

const Stack = createNativeStackNavigator<CoursesStackParamList>();

export default function CoursesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Courses" component={Courses} options={{title: 'Courses'}} />
      <Stack.Screen
        name="CourseSubjects"
        component={CourseSubjects}
        options={({route}) => ({title: route.params.courseTitle})}
      />
      <Stack.Screen
        name="SubjectQuizzes"
        component={SubjectQuizzes}
        options={({route}) => ({title: route.params.subjectName})}
      />
    </Stack.Navigator>
  );
}
