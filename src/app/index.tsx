import React, { useState } from 'react';

import {
  View,
  Text,
  Button,
  StyleSheet,
} from 'react-native';

export default function Index() {

  const [iniciou, setIniciou] = useState(false);
  const [tipo, setTipo] = useState('');

  function comecar() {
    setIniciou(true);
  }

  function escolherTipo(valor: string) {
    setTipo(valor);
  }

  return (
    <View style={styles.container}>

      {!iniciou ? (
        <>
          <Text style={styles.titulo}>
            Roleta do Tédio
          </Text>

          <Text style={styles.descricao}>
            Vocês se juntaram e mesmo assim não sabem o que fazer?
          </Text>

          <Button
            title="Começar"
            onPress={comecar}
          />
        </>
      ) : (
        <>
          <Text style={styles.titulo}>
            Quem está jogando?
          </Text>

          <Text style={styles.descricao}>
            Isso vai ajudar a gente a escolher o nível certo .
          </Text>

          <Button
            title="Casal"
            onPress={() => escolherTipo('casal')}
          />

          <View style={styles.espaco} />

          <Button
            title="Amigos"
            onPress={() => escolherTipo('amigos')}
          />

          <View style={styles.espaco} />

          <Button
            title="Sozinho"
            onPress={() => escolherTipo('sozinho')}
          />

          <Text style={styles.resultado}>
            {tipo !== '' ? `Você escolheu: ${tipo}` : ''}
          </Text>
        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },

  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },

  descricao: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },

  espaco: {
    height: 10,
  },

  resultado: {
    fontSize: 18,
    marginTop: 25,
    textAlign: 'center',
  },

});