import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Courses from '../screens/Courses';
import CourseSubjects from '../screens/CourseSubjects';
import SubjectDetail from '../screens/SubjectDetail';
import LessonDetail from '../screens/LessonDetail';
import MaterialViewer from '../screens/MaterialViewer';
import {statusBarScreenOptions, withSafeArea} from '../theme/navigation';

export type CoursesStackParamList = {
  Courses: undefined;
  CourseSubjects: {courseId: string; courseTitle: string};
  SubjectDetail: {subjectId: string; subjectName: string};
  LessonDetail: {lessonId: string; lessonTitle: string};
  MaterialViewer: {url: string; title: string};
};

const Stack = createNativeStackNavigator<CoursesStackParamList>();

export default function CoursesStack() {
  return (
    <Stack.Navigator
      screenOptions={statusBarScreenOptions}
      screenLayout={({route, options, children}) =>
        withSafeArea(route.name, options.headerShown, children)
      }>
      <Stack.Screen name="Courses" component={Courses} options={{title: 'Courses'}} />
      <Stack.Screen
        name="CourseSubjects"
        component={CourseSubjects}
        options={({route}) => ({title: route.params.courseTitle})}
      />
      <Stack.Screen
        name="SubjectDetail"
        component={SubjectDetail}
        options={({route}) => ({title: route.params.subjectName})}
      />
      <Stack.Screen
        name="LessonDetail"
        component={LessonDetail}
        options={({route}) => ({title: route.params.lessonTitle})}
      />
      <Stack.Screen
        name="MaterialViewer"
        component={MaterialViewer}
        options={({route}) => ({title: route.params.title})}
      />
    </Stack.Navigator>
  );
}
