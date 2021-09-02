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

interface Placement {
	x: number;
	y: number;
	height: number;
	width: number;
}

export interface Background {
	type: BackgroundType;
	value: string | Buffer;
}

export interface ProgressBar extends Placement {
	rounded: boolean;
	trackColour: string;
	barColour: {
		type: ProgressType;
		value: string | string[];
	}
}

export interface Avatar extends Placement {
	source: string | Buffer;
}

export interface Status {
	width: number;
	type: PresenceStatus;
	colour: string;
	circle: boolean;
}

export interface Overlay {
	display: boolean;
	alpha: number;
	colour: string;
}

export interface CardData {
	width: number;
	height: number;
	background: Background;
	progressBar: ProgressBar;
	avatar: Avatar;
	status: Status;
	overlay: Overlay;
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
