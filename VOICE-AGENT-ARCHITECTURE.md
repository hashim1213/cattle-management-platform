# "Farm Hand" Voice Agent Architecture (AI-001/002)

## Overview
The Farm Hand voice agent is a hands-free, AI-powered data entry system that allows farmers to record cattle operations using natural language while working in the field.

## Core Use Cases

### Primary Scenarios
1. **"Shot pen three with Resflor"** → Records health treatment, deducts inventory
2. **"Fed pen two five bales of hay"** → Records feed allocation, updates inventory
3. **"Moved tag 1234 from pen A to pen B"** → Records movement, updates pen counts
4. **"Weighed tag 5678 at 1150 pounds"** → Creates weight record, updates cattle data
5. **"Tag 9012 is sick, separated to hospital pen"** → Updates health status, logs movement

## Technical Architecture

### 1. Voice Input Layer

#### Browser-Based (Development/Testing)
```typescript
// /lib/voice-input.ts
interface VoiceInputConfig {
  language: 'en-CA' | 'en-US'
  continuous: boolean
  interimResults: boolean
}

class VoiceInputService {
  private recognition: SpeechRecognition

  startListening(onResult: (transcript: string) => void): void
  stopListening(): void
  isSupported(): boolean
}
```

**Technology**: Web Speech API
- **Pros**: No cost, works offline, instant
- **Cons**: Browser-dependent, less accurate
- **Use**: Development, testing, demo mode

#### Production-Grade (Deployed)
```typescript
// /lib/voice-transcription.ts
interface TranscriptionService {
  transcribe(audioBlob: Blob): Promise<string>
  provider: 'openai-whisper' | 'google-speech' | 'azure-speech'
}
```

**Technology**: OpenAI Whisper API
- **Pros**: Highly accurate, handles farm terminology, multilingual
- **Cons**: Requires API key, internet connection, per-minute cost
- **Cost**: ~$0.006 per minute
- **Use**: Production deployment

### 2. Natural Language Processing Layer

#### Intent Recognition
```typescript
// /lib/voice-agent/intent-parser.ts

enum VoiceIntent {
  HEALTH_TREATMENT = 'health_treatment',
  FEED_ALLOCATION = 'feed_allocation',
  WEIGHT_RECORD = 'weight_record',
  MOVEMENT_RECORD = 'movement_record',
  HEALTH_STATUS_UPDATE = 'health_status_update',
  BULK_OPERATION = 'bulk_operation',
  QUERY_DATA = 'query_data',
  UNKNOWN = 'unknown'
}

interface ParsedCommand {
  intent: VoiceIntent
  confidence: number
  entities: Entity[]
  rawTranscript: string
}

interface Entity {
  type: 'pen' | 'tag' | 'drug' | 'feed' | 'weight' | 'quantity' | 'date'
  value: string
  normalized: string | number
  confidence: number
}
```

#### Pattern Matching Rules
```typescript
const intentPatterns: Record<VoiceIntent, RegExp[]> = {
  HEALTH_TREATMENT: [
    /shot|vaccinated|treated|gave|injected/i,
    /pen (\w+) with (\w+)/i,
    /tag (\d+) (with|got) (\w+)/i
  ],
  FEED_ALLOCATION: [
    /fed|feeding|feed/i,
    /(\d+) bales of (\w+)/i,
    /pen (\w+) got (\d+) (pounds|lbs|tons)/i
  ],
  WEIGHT_RECORD: [
    /weighed|weight|scale/i,
    /tag (\d+) (at|weighs|is) (\d+) (pounds|lbs)/i
  ],
  MOVEMENT_RECORD: [
    /moved|transferred|put/i,
    /from pen (\w+) to pen (\w+)/i,
    /tag (\d+) to (\w+)/i
  ]
}
```

#### Entity Extraction
```typescript
class EntityExtractor {
  extractPenNumber(text: string): string | null {
    // "pen 3", "pen three", "pen A", "pen alpha"
    const patterns = [
      /pen (\d+)/i,
      /pen ([a-z])/i,
      /pen (one|two|three|four|five|six|seven|eight|nine|ten)/i
    ]
    // Return normalized pen ID
  }

  extractTagNumber(text: string): string | null {
    // "tag 1234", "1234", "tag alpha one two three"
    const patterns = [
      /tag (\d{3,6})/i,
      /number (\d{3,6})/i,
      /\b(\d{4})\b/
    ]
    // Return cattle tag number
  }

  extractDrugName(text: string): string | null {
    // Match against inventory drug names
    // "Resflor", "ivomec", "LA200"
    // Use fuzzy matching for pronunciation variations
  }

  extractQuantity(text: string): { value: number, unit: string } | null {
    // "5 bales", "1150 pounds", "2.5 cc"
    const pattern = /(\d+(?:\.\d+)?)\s*(bales?|pounds?|lbs?|cc|ml|tons?)/i
  }
}
```

### 3. GPT-4 Integration (Fallback & Disambiguation)

```typescript
// /lib/voice-agent/gpt-parser.ts

interface GPTParserConfig {
  apiKey: string
  model: 'gpt-4' | 'gpt-4-turbo'
  temperature: 0.0 // Deterministic
}

class GPTCommandParser {
  async parseCommand(transcript: string, context: FarmContext): Promise<ParsedCommand> {
    const prompt = `
You are a cattle farm assistant. Parse this voice command into structured data.

Available pens: ${context.pens.map(p => p.name).join(', ')}
Available drugs in inventory: ${context.drugs.map(d => d.name).join(', ')}
Available feed: ${context.feed.map(f => f.name).join(', ')}

Voice command: "${transcript}"

Extract:
1. Intent (health_treatment, feed_allocation, movement, weight, etc.)
2. Pen number/name
3. Tag number (if applicable)
4. Drug/feed name (if applicable)
5. Quantity and unit
6. Any other relevant details

Return JSON format.
`

    const response = await openai.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' }
    })

    return JSON.parse(response.choices[0].message.content)
  }
}
```

### 4. Action Execution Layer

```typescript
// /lib/voice-agent/action-executor.ts

interface ActionResult {
  success: boolean
  message: string
  affectedRecords: string[]
  inventoryChanges?: InventoryChange[]
}

class VoiceActionExecutor {
  async executeHealthTreatment(params: {
    penId?: string
    cattleIds?: string[]
    drugName: string
    quantity: number
    unit: string
  }): Promise<ActionResult> {
    // 1. Find cattle (by pen or by tag)
    // 2. Verify drug exists in inventory
    // 3. Check sufficient quantity
    // 4. Create health records for each animal
    // 5. Deduct from drug inventory
    // 6. Return confirmation
  }

  async executeFeedAllocation(params: {
    penId: string
    feedType: string
    quantity: number
    unit: string
  }): Promise<ActionResult> {
    // 1. Verify pen exists
    // 2. Verify feed exists in inventory
    // 3. Check sufficient quantity
    // 4. Create feed allocation record
    // 5. Deduct from feed inventory
    // 6. Update pen feed history
    // 7. Return confirmation
  }

  async executeMovement(params: {
    cattleId: string
    fromPenId: string
    toPenId: string
  }): Promise<ActionResult> {
    // 1. Verify cattle exists
    // 2. Verify pens exist
    // 3. Create movement record (CCIA compliance)
    // 4. Update cattle pen assignment
    // 5. Update pen counts
    // 6. Return confirmation
  }

  async executeWeightRecord(params: {
    cattleId: string
    weight: number
    unit: string
  }): Promise<ActionResult> {
    // 1. Verify cattle exists
    // 2. Create weight record
    // 3. Update cattle current weight
    // 4. Calculate ADG if previous weights exist
    // 5. Return confirmation with trends
  }
}
```

### 5. UI Components

#### Voice Button Component
```typescript
// /components/voice-input-button.tsx

interface VoiceInputButtonProps {
  onCommand: (result: ParsedCommand) => void
  mode?: 'always-on' | 'push-to-talk'
}

export function VoiceInputButton({ onCommand, mode = 'push-to-talk' }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleVoiceInput = async () => {
    // 1. Start voice recognition
    // 2. Show live transcript
    // 3. Parse command when complete
    // 4. Execute action
    // 5. Show confirmation
  }

  return (
    <Button
      onMouseDown={startListening}
      onMouseUp={stopListening}
      className="voice-button"
    >
      <Mic className={isListening ? 'animate-pulse' : ''} />
      {isListening ? 'Listening...' : 'Hold to Speak'}
    </Button>
  )
}
```

#### Voice Confirmation Dialog
```typescript
// /components/voice-confirmation-dialog.tsx

interface VoiceConfirmationProps {
  command: ParsedCommand
  previewData: ActionPreview
  onConfirm: () => void
  onEdit: () => void
  onCancel: () => void
}

export function VoiceConfirmationDialog({ command, previewData, onConfirm }: VoiceConfirmationProps) {
  // Shows:
  // - What was heard: "Shot pen 3 with Resflor"
  // - What was understood: "Health treatment for 45 cattle in Pen 3"
  // - What will happen: "Deduct 225cc Resflor Gold from inventory"
  // - Affected animals: List of tag numbers
  // - Buttons: Confirm, Edit, Cancel
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Implement Web Speech API integration
- [ ] Build basic intent parser with regex patterns
- [ ] Create entity extractor for pens, tags, quantities
- [ ] Build voice input button component
- [ ] Test with 5 core use cases

### Phase 2: GPT Integration (Week 3)
- [ ] Integrate OpenAI API
- [ ] Build GPT-based command parser
- [ ] Implement fallback logic (regex → GPT)
- [ ] Add context awareness (farm inventory, pen names)
- [ ] Test disambiguation scenarios

### Phase 3: Action Execution (Week 4)
- [ ] Implement health treatment executor
- [ ] Implement feed allocation executor
- [ ] Implement movement tracker executor
- [ ] Implement weight record executor
- [ ] Add inventory deduction logic

### Phase 4: Production Features (Week 5-6)
- [ ] Add OpenAI Whisper for production transcription
- [ ] Implement confirmation dialogs
- [ ] Add voice feedback (text-to-speech confirmations)
- [ ] Build command history and undo
- [ ] Add offline queue for voice commands
- [ ] Comprehensive error handling

### Phase 5: Advanced Features (Week 7+)
- [ ] Multi-language support (French-Canadian)
- [ ] Custom vocabulary training
- [ ] Bluetooth headset integration
- [ ] Hands-free mode with wake word
- [ ] Voice analytics dashboard

## Example Flows

### Flow 1: Bulk Health Treatment
```
User: "Shot pen 3 with Resflor Gold"

1. Voice → Transcript: "shot pen three with resflor gold"
2. Parser → Intent: HEALTH_TREATMENT
3. Entities:
   - Pen: "3" (normalized to pen ID "pen-3")
   - Drug: "Resflor Gold" (matched from inventory)
4. Query: Find all cattle in pen-3 → 45 animals
5. Check: Inventory has 500cc Resflor Gold → Sufficient (need 225cc)
6. Confirmation Dialog:
   "Treat 45 cattle in Pen 3 with Resflor Gold (5cc each)?
    Will deduct 225cc from inventory (275cc remaining)"
7. User: Confirms
8. Actions:
   - Create 45 health records
   - Deduct 225cc from inventory
   - Log voice command for audit
9. Confirmation: "✓ Treated 45 cattle in Pen 3. Inventory updated."
```

### Flow 2: Individual Weight Recording
```
User: "Tag 1234 weighs 1150 pounds"

1. Voice → Transcript: "tag one two three four weighs eleven fifty pounds"
2. Parser → Intent: WEIGHT_RECORD
3. Entities:
   - Tag: "1234"
   - Weight: 1150
   - Unit: "pounds"
4. Query: Find cattle with tag 1234
5. Check: Last weight was 980 lbs on Nov 1 (30 days ago)
6. Calculate: ADG = (1150 - 980) / 30 = 5.67 lbs/day
7. Confirmation Dialog:
   "Record weight for Tag 1234 (Bull-Angus)?
    Weight: 1150 lbs
    Gain: +170 lbs in 30 days (5.67 lbs/day) ✓"
8. User: Confirms
9. Actions:
   - Create weight record
   - Update cattle.weight = 1150
   - Log ADG calculation
10. Confirmation: "✓ Weight recorded. Excellent gain of 5.67 lbs/day!"
```

## Technology Stack

### Voice Recognition
- **Development**: Web Speech API (free, browser-based)
- **Production**: OpenAI Whisper ($0.006/min, 99% accuracy)
- **Alternative**: Google Cloud Speech-to-Text, Azure Speech

### NLP/Intent Parsing
- **Primary**: Custom regex patterns (fast, offline, free)
- **Fallback**: GPT-4 Turbo ($0.01/1K tokens, handles edge cases)
- **Entity Matching**: Fuzzy string matching (fuse.js)

### Text-to-Speech (Voice Confirmations)
- **Browser**: Web Speech Synthesis API (free)
- **Production**: ElevenLabs or Google TTS (optional)

## Security & Compliance

### Data Privacy
- Voice recordings **NOT** stored
- Only transcripts logged for audit trail
- HTTPS required for Web Speech API
- API keys stored in environment variables

### Audit Trail
```typescript
interface VoiceCommandLog {
  id: string
  timestamp: string
  userId: string
  transcript: string
  intent: VoiceIntent
  parsedCommand: ParsedCommand
  actionResult: ActionResult
  ipAddress?: string
}
```

### CCIA Compliance
- All movement commands automatically create CCIA-compliant records
- Voice commands include operator identification
- Timestamp precision for regulatory reporting

## Cost Estimation

### Per-Farm Monthly Cost (500 cattle, 50 commands/day)
```
Voice Transcription (OpenAI Whisper):
- 50 commands × 5 seconds × 30 days = 125 minutes/month
- 125 min × $0.006 = $0.75/month

NLP Processing (GPT-4 Turbo):
- 20% fallback rate × 50 commands = 10 GPT calls/day
- 10 calls × 500 tokens × 30 days = 150K tokens/month
- 150K × $0.01/1K = $1.50/month

Total: ~$2.25/month per farm
```

## Success Metrics

### Accuracy Targets
- Intent recognition: >95%
- Entity extraction: >90%
- End-to-end correct action: >85%

### User Experience
- Average command completion: <10 seconds
- User satisfaction: >4.5/5 stars
- Time saved vs manual entry: >60%

### Adoption Goals
- 50% of health records via voice within 3 months
- 70% of feed allocations via voice within 6 months
- 40% of weight records via voice within 3 months

## Next Steps

1. **Prototype** (This Week)
   - Build Web Speech API integration
   - Test 5 core commands with regex parser
   - Demo to user for feedback

2. **MVP** (Next 2 Weeks)
   - Add GPT-4 fallback
   - Implement inventory deductions
   - Build confirmation UI
   - Deploy for alpha testing

3. **Production** (Month 2)
   - Switch to Whisper API
   - Add comprehensive error handling
   - Implement offline queue
   - Launch to beta users

---

**This architecture enables hands-free, AI-powered data entry that saves farmers 60%+ time on record-keeping while ensuring 100% inventory accuracy.**
