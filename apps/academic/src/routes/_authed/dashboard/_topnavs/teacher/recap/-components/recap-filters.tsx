import { Label } from "@repo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";

type RecapFilterOption = {
  id: string;
  name: string;
};

type RecapPeriodOption = {
  id: string;
  name: string;
  academicYearLabel: string;
};

type RecapClassOption = {
  id: string;
  name: string;
  kkm: number;
};

type RecapFiltersProps = {
  periods: RecapPeriodOption[];
  classes: RecapClassOption[];
  subjects: RecapFilterOption[];
  selectedPeriodId: string;
  selectedClassId: string;
  selectedSubjectId: string;
  onPeriodChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
};

export function RecapFilters({
  periods,
  classes,
  subjects,
  selectedPeriodId,
  selectedClassId,
  selectedSubjectId,
  onPeriodChange,
  onClassChange,
  onSubjectChange,
}: RecapFiltersProps) {
  return (
    <div className="rounded-lg bg-surface-contrast p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="period-filter">Periode Akademik</Label>
          <Select value={selectedPeriodId} onValueChange={onPeriodChange}>
            <SelectTrigger id="period-filter" className="w-full">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name} · {period.academicYearLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="class-filter">Kelas</Label>
          <Select value={selectedClassId} onValueChange={onClassChange}>
            <SelectTrigger id="class-filter" className="w-full">
              <SelectValue placeholder="Pilih kelas" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject-filter">Mata Pelajaran</Label>
          <Select value={selectedSubjectId} onValueChange={onSubjectChange}>
            <SelectTrigger id="subject-filter" className="w-full">
              <SelectValue placeholder="Pilih mata pelajaran" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
