import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Platform, StatusBar, ImageBackground } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, firestore } from './firebaseConfig';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function App() {
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const atualizaUsuario = onAuthStateChanged(auth, (usuario) => {
      setUsuario(usuario);
    });

    return () => atualizaUsuario();
  }, []);

  useEffect(() => {
    if (usuario) {
      const q = query(collection(firestore, 'messages'), where('uid', '==', usuario.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const mensagensBuscadas = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMensagens(mensagensBuscadas);
        setCarregando(false);
      });

      return () => unsubscribe();
    } else {
      setMensagens([]);
    }
  }, [usuario]);

  const entrar = () => {
    signInWithEmailAndPassword(auth, email, senha)
      .then(userCredential => {
        setUsuario(userCredential.user);
        setEmail('');
        setSenha('');
      })
      .catch(error => alert(error.message));
  };

  const sair = () => {
    signOut(auth)
      .then(() => setUsuario(null))
      .catch(error => alert(error.message));
  };

  const excluirMensagem = async (idMensagem) => {
    try {
      await deleteDoc(doc(firestore, 'messages', idMensagem));
    } catch (error) {
      console.error("Erro ao excluir mensagem: ", error);
    }
  };

  const marcarComoVisto = async (idMensagem) => {
    try {
      await updateDoc(doc(firestore, 'messages', idMensagem), {
        seen: true
      });
    } catch (error) {
      console.error("Erro ao marcar mensagem como vista: ", error);
    }
  };

  return (
    <ImageBackground source={require('./assets/bground.png')} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {usuario ? (
        <>
          <Text style={styles.welcomeText}>Bem-vindo, {usuario.email}</Text>
          <TouchableOpacity style={styles.botaoSair} onPress={sair}>
            <MaterialIcons name="logout" size={24} color="white" />
            <Text style={styles.botaoTexto}>Sair</Text>
          </TouchableOpacity>
          {carregando ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <ScrollView style={styles.mensagensContainer}>
              {mensagens.map((msg) => (
                <View key={msg.id} style={styles.mensagemContainer}>
                  <Text style={styles.mensagemTexto}>{msg.text}</Text>
                  <Text style={styles.timestamp}>
                    {new Date(msg.createdAt?.toDate()).toLocaleString()}
                  </Text>
                  <View style={styles.botaoContainer}>
                    {!msg.seen && (
                      <TouchableOpacity onPress={() => marcarComoVisto(msg.id)} style={styles.vistoBotao}>
                        <MaterialIcons name="check" size={24} color="white" />
                        <Text style={styles.vistoTexto}>Marcar como Visto</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => excluirMensagem(msg.id)} style={styles.excluirBotao}>
                      <MaterialIcons name="delete" size={24} color="white" />
                      <Text style={styles.excluirTexto}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />
          <TouchableOpacity style={styles.botao} onPress={entrar}>
            <MaterialIcons name="login" size={24} color="white" />
            <Text style={styles.botaoTexto}>Entrar</Text>
          </TouchableOpacity>
        </>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    elevation: 4,
  },
  input: {
    fontSize: 20,
    width: '100%',
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2,
  },
  mensagensContainer: {
    width: '100%',
    flex: 1,
  },
  mensagemContainer: {
    marginVertical: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2,
  },
  mensagemTexto: {
    fontSize: 18,
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  botaoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  vistoBotao: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  vistoTexto: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  excluirBotao: {
    backgroundColor: '#CA222D',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  excluirTexto: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  botao: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
  },
  botaoSair: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
