export type LiteModeKey = 'all' | 'gif' | 'video' |
  'emoji' | 'emoji_panel' | 'emoji_messages' |
  'effects' | 'effects_reactions' | 'effects_premiumstickers' | 'effects_emoji' |
  'stickers' | 'stickers_panel' | 'stickers_chat' |
  'chat' | 'chat_background' | 'chat_spoilers' | 'animations';

export class LiteMode {
  public isEnabled() {
    return true;
  }

  public isAvailable(key: LiteModeKey) {
    return true;
  }
}

const liteMode = new LiteMode();
export default liteMode;
