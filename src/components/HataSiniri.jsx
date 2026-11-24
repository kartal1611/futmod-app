import { Component } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

/**
 * Ekran çizilirken bir hata olursa uygulama boş kalmasın: hatayı ekrana yazar.
 * Test edenler ekran görüntüsü atınca sebebi doğrudan görürüz.
 */
export default class HataSiniri extends Component {
  constructor(props) {
    super(props);
    this.state = { hata: null };
  }

  static getDerivedStateFromError(hata) {
    return { hata };
  }

  render() {
    const { hata } = this.state;
    if (!hata) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: '#0c0d10', paddingTop: 70, paddingHorizontal: 20 }}>
        <Text style={{ color: '#F4C24D', fontSize: 20, fontWeight: '900' }}>Bir hata oluştu</Text>
        <Text style={{ color: '#a8adb8', fontSize: 13, marginTop: 6 }}>Bu ekranın görüntüsünü destek ekibine gönder.</Text>
        <ScrollView style={{ marginTop: 14, maxHeight: 360 }}>
          <Text selectable style={{ color: '#f5f5f2', fontSize: 12 }}>{String(hata?.message || hata)}</Text>
          <Text selectable style={{ color: '#767c88', fontSize: 10.5, marginTop: 8 }}>{String(hata?.stack || '').split('\n').slice(0, 12).join('\n')}</Text>
        </ScrollView>
        <Pressable onPress={() => this.setState({ hata: null })} style={{ marginTop: 18, backgroundColor: '#F4C24D', borderRadius: 4, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#0c0d10', fontWeight: '900' }}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }
}
