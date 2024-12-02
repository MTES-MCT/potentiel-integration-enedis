import * as json2csv from "@json2csv/plainjs";
import * as csv2json from "csv-parse/sync";

export type UploadToS3Props<T> = {
	data: T;
};

const delimiter = ";";

export const getDataAsCsv = async <TRaw extends object>({
	data,
}: UploadToS3Props<TRaw>) => {
	const csvParser = new json2csv.Parser({ delimiter });
	return csvParser.parse(data);
};

export const getCsvAsData = (data: string) => {
	return csv2json.parse(data, {
		delimiter,
		encoding: "utf-8",
		skipEmptyLines: true,
		skipRecordsWithEmptyValues: true,
		columns: true,
	});
};
