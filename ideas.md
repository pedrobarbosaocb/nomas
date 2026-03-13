# Design Ideas - Apartment Tinder

## Abordagem Selecionada: Minimalismo Escandinavo com Foco em Clareza

### Design Movement
**Minimalismo Escandinavo** - Simplicidade funcional, espaço em branco generoso, e foco absoluto na usabilidade. Inspirado em design nórdico que prioriza clareza sobre decoração.

### Core Principles
1. **Espaço em Branco Generoso** - Cada elemento respira, sem aglomeração visual
2. **Tipografia Clara e Hierárquica** - Distinção clara entre títulos, subtítulos e corpo de texto
3. **Interação Intuitiva** - Gestos e ações devem ser óbvias (swipe, like/dislike)
4. **Paleta Neutra com Acentos Sutis** - Tons cinzentos, brancos e um único acento de cor para ações

### Color Philosophy
- **Fundo**: Branco puro (`#FFFFFF`) para máxima clareza
- **Texto Principal**: Cinza escuro muito escuro (`#1a1a1a`)
- **Texto Secundário**: Cinza médio (`#666666`)
- **Acento Positivo (Like)**: Verde suave (`#10b981`)
- **Acento Negativo (Dislike)**: Vermelho suave (`#ef4444`)
- **Bordas e Dividers**: Cinza muito claro (`#e5e5e5`)

### Layout Paradigm
- **Tela de Listagem**: Grid simples com cards em 2 colunas (responsivo para 1 coluna em mobile)
- **Tela Tinder**: Card centralizado, ocupando ~80% da viewport, com gestos de swipe
- **Navegação**: Abas simples no topo (Listagem / Tinder)

### Signature Elements
1. **Card Minimalista** - Bordas sutis, sombra muito leve, sem arredondamentos excessivos
2. **Indicador de Status** - Badge pequeno no canto do card mostrando Like/Dislike/Não Avaliado
3. **Transições Suaves** - Fade-in/fade-out entre cards, swipe fluido

### Interaction Philosophy
- **Tinder**: Swipe horizontal (ou botões) para left/right
- **Listagem**: Clique no card para ver detalhes ou mudar status
- **Feedback Visual**: Mudança de cor/opacidade ao interagir

### Animation
- **Card Swipe**: Rotação suave + fade-out ao sair da tela
- **Status Badge**: Transição de cor ao mudar de estado
- **Hover States**: Elevação sutil (sombra aumenta) ao passar o mouse

### Typography System
- **Display/Títulos**: `font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 1.5rem`
- **Subtítulos**: `font-family: 'Poppins', sans-serif; font-weight: 500; font-size: 1rem`
- **Corpo**: `font-family: 'Inter', sans-serif; font-weight: 400; font-size: 0.95rem`
- **Pequeno**: `font-family: 'Inter', sans-serif; font-weight: 400; font-size: 0.85rem`

---

## Implementação
- Usar Tailwind CSS para layout e espaçamento
- Shadcn/ui para componentes base (Button, Card, Badge)
- Framer Motion para animações de swipe
- LocalStorage para persistência de likes/dislikes
