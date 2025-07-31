import { observer } from "@legendapp/state/react";
import { Image } from "expo-image";
import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import UserProfile from "@/components/UserProfile";

import { todos$ as _todos$, addTodo, toggleDone } from "@/utils/SupaLegend";
import { Database } from "@/utils/database.types";

type Todo = Database["public"]["Tables"]["todos"]["Row"];

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

const Todo = ({ todo }: { todo: Todo }) => {
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
  const renderItem = ({ item: todo }: { item: Todo }) => <Todo todo={todo} />;
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

// A button component to delete all the todos, only shows when there are some.
const ClearTodos = observer(() => {
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
    <>
      <ThemedText type="title" style={styles.heading}>
        MyCompanion Demo
      </ThemedText>
      <NewTodo />
      <Todos todos$={_todos$} />
      <ClearTodos />
    </>
  );
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
        <ThemedText type="title">Welcome to MyCompanion!</ThemedText>
        <HelloWave />
      </ThemedView>

      {/* Profil utilisateur connecté */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">👤 Votre Profil</ThemedText>
        <UserProfile />
      </ThemedView>

      {/* <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">
          📝 Todo Demo (Legend-State + Supabase)
        </ThemedText>
        <ThemedText>
          Ceci est un exemple fonctionnel de synchronisation en temps réel avec
          Supabase et Legend-State.
        </ThemedText>
        <App />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">🚀 Prochaines étapes</ThemedText>
        <ThemedText>
          Maintenant que l'authentification fonctionne, vous pouvez commencer à
          développer les fonctionnalités MyCompanion :
        </ThemedText>
        <ThemedText style={styles.bulletPoint}>
          • Interface pour les seniors
        </ThemedText>
        <ThemedText style={styles.bulletPoint}>• Dashboard famille</ThemedText>
        <ThemedText style={styles.bulletPoint}>
          • Gestion des alertes
        </ThemedText>
        <ThemedText style={styles.bulletPoint}>
          • Rapports d'activité
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">🛠️ Développement</ThemedText>
        <ThemedText>
          Utilisez les scripts npm pour gérer vos données :
        </ThemedText>
        <ThemedText style={styles.command}>npm run seed:demo</ThemedText>
        <ThemedText style={styles.command}>npm run health:check</ThemedText>
        <ThemedText style={styles.command}>npm run analytics:report</ThemedText>
      </ThemedView> */}
    </ParallaxScrollView>
  );
}

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
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
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
    color: "#d32f2f",
    fontWeight: "600",
  },
  bulletPoint: {
    marginLeft: 16,
    marginVertical: 2,
  },
  command: {
    fontFamily: "monospace",
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 4,
    marginVertical: 2,
  },
});
