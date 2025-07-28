import { todos$ as _todos$, addTodo, toggleDone } from "@/utils/SupaLegend";
import { Tables } from "@/utils/database.types";
import { observer } from "@legendapp/state/react";
import { Image } from "expo-image";
import { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const NOT_DONE_ICON = String.fromCodePoint(0x1f7e0);
const DONE_ICON = String.fromCodePoint(0x2705);

const NewTodo = () => {
  const [text, setText] = useState("");
  const handleSubmitEditing = ({
    nativeEvent: { text },
  }: {
    nativeEvent: { text: string };
  }) => {
    setText("");
    addTodo(text);
  };
  return (
    <TextInput
      value={text}
      onChangeText={(text) => setText(text)}
      onSubmitEditing={handleSubmitEditing}
      placeholder="What do you want to do today?"
      style={styles.input}
    />
  );
};

const Todo = ({ todo }: { todo: Tables<"todos"> }) => {
  const handlePress = () => {
    toggleDone(todo.id);
  };
  return (
    <TouchableOpacity
      key={todo.id}
      onPress={handlePress}
      style={[styles.todo, todo.done ? styles.done : null]}
    >
      <Text style={styles.todoText}>
        {todo.done ? DONE_ICON : NOT_DONE_ICON} {todo.text}
      </Text>
    </TouchableOpacity>
  );
};

// A list component to show all the todos.
const Todos = observer(({ todos$ }: { todos$: typeof _todos$ }) => {
  // Get the todos from the state and subscribe to updates
  const todos = todos$.get();
  const renderItem = ({ item: todo }: { item: Tables<"todos"> }) => (
    <Todo todo={todo} />
  );
  if (todos)
    return (
      <FlatList
        data={Object.values(todos)}
        renderItem={renderItem}
        style={styles.todos}
      />
    );

  return <></>;
});

// ✅ CORRIGÉ : Composant ClearTodos qui fonctionne maintenant
const ClearTodos = observer(() => {
  // Récupérer les todos depuis le state et s'abonner aux changements
  const todos = _todos$.get();

  // Calculer le nombre de todos
  const todosCount = todos ? Object.keys(todos).length : 0;

  const handlePress = () => {
    // Supprimer tous les todos
    if (todos) {
      Object.keys(todos).forEach((id) => {
        _todos$[id].delete();
      });
    }
  };

  // Afficher le bouton seulement s'il y a des todos
  return todosCount > 0 ? (
    <TouchableOpacity onPress={handlePress}>
      <Text style={styles.clearTodos}>Clear all ({todosCount})</Text>
    </TouchableOpacity>
  ) : null;
});

// The main app.
const App = observer(() => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* <ThemedText>
          <Text>Hello</Text>
        </ThemedText>
 */}
        <Text style={styles.heading}>Legend-State Example</Text>
        <NewTodo />
        <Todos todos$={_todos$} />
        <ClearTodos />
      </SafeAreaView>
    </SafeAreaProvider>
  );
});

// Styles for the app.
const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  container: {
    flex: 1,
    margin: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    borderColor: "#999",
    borderRadius: 8,
    borderWidth: 2,
    flex: 0,
    height: 64,
    marginTop: 16,
    padding: 16,
    fontSize: 20,
  },
  todos: {
    flex: 1,
    marginTop: 16,
  },
  todo: {
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#ffd",
  },
  done: {
    backgroundColor: "#dfd",
  },
  todoText: {
    fontSize: 20,
  },
  clearTodos: {
    margin: 16,
    flex: 0,
    textAlign: "center",
    fontSize: 16,
    color: "#d32f2f", // Rouge pour indiquer la suppression
    fontWeight: "600",
  },
});

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          to see changes. Press{" "}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: "cmd + d",
              android: "cmd + m",
              web: "F12",
            })}
          </ThemedText>{" "}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <App />
      </ThemedView>
    </ParallaxScrollView>
  );
}
