import { GuildMember, PresenceStatus } from 'discord.js';

type ProgressType = 'gradient' | 'colour';
type BackgroundType = 'image' | 'colour';

export interface BuildFonts {
	bold: string;
	regular: string;
}

export interface Font {
	path: string;
	family: string;
	weight?: string;
	style?: string;
}

export interface InputData {
	level: number;
	xpForLevel: (level: number) => number;
	user: GuildMember | null;
	rank?: number;
	fonts?: Font[];
	usernameLength?: number;
	stripAccents?: boolean;
}

interface PartialPiece<T> {
	data: T;
	colour: string;
	size: number;
}

interface Piece<T> extends PartialPiece<T> {
	display: boolean;
	displayText: string;
}

export interface CardData {
	width: number;
	height: number;
	background: {
		type: BackgroundType;
		value: string | Buffer;
	};
	progressBar: {
		rounded: boolean;
		x: number;
		y: number;
		height: number;
		width: number;
		trackColour: string;
		barColour: {
			type: ProgressType;
			value: string | string[];
		};
	};
	avatar: {
		source: string | Buffer;
		x: number;
		y: number;
		height: number;
		width: number;
	};
	status: {
		width: number;
		type: PresenceStatus;
		colour: string;
		circle: boolean;
	};
	overlay: {
		display: boolean;
		level: number;
		colour: string;
	};
	rank: Piece<number>;
	level: Piece<number>;
	currentXP: PartialPiece<number>;
	requiredXP: PartialPiece<number>;
	discriminator: PartialPiece<string>;
	username: PartialPiece<string>;
}

export class RankCard {
	constructor(input: InputData);

	private _data: CardData;
	private _calculateProgress(): number;

	setBackground<T extends BackgroundType>(type: T, value: T extends 'colour' ? string : Buffer): RankCard;
	setOverlay(colour: string, level?: number, display?: boolean): RankCard;
	setProgressBar<T extends ProgressType>(type: T, value: T extends 'colour' ? string : string[], rounded?: boolean): RankCard;
	setProgressBarTrack(colour: string): RankCard;
	build(fonts?: BuildFonts): Promise<Buffer>;
}
