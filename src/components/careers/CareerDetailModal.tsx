"use client";

import { useState, useEffect } from "react";
import type { CareerDetail } from "@/types/career";
import { getCareerById } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import { DollarSign, GraduationCap, MapPin, ExternalLink, BookOpen, Award, Landmark, Wrench, Info, Heart, Sparkles } from "lucide-react";

interface CareerDetailModalProps {
  careerId: string;
  onClose: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  onAskAI?: (careerId: string, careerTitle: string) => void;
}

export default function CareerDetailModal({ careerId, onClose, isFavorited, onToggleFavorite, onAskAI }: CareerDetailModalProps) {
  const [career, setCareer] = useState<CareerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getCareerById(careerId)
      .then((data) => {
        if (!cancelled) setCareer(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load career details");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [careerId]);

  return (
    <Modal isOpen onClose={onClose} title={career?.title || "Career Details"} size="lg">
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
        </div>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-400">{error}</p>
      ) : career ? (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-text-secondary">{career.description}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-text-secondary">
              {career.average_salary && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  ${(career.average_salary / 1000).toFixed(0)}k avg salary
                </span>
              )}
              {career.demand_level && (
                <span className="capitalize">{career.demand_level.replace("_", " ")} demand</span>
              )}
              {career.growth_outlook && (
                <span className="capitalize">{career.growth_outlook.replace("_", " ")} growth</span>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2">
              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite(careerId)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isFavorited
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-border bg-background/50 text-text-secondary hover:border-accent hover:text-accent"
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${isFavorited ? "fill-accent" : ""}`} />
                  {isFavorited ? "Saved" : "Save"}
                </button>
              )}
              {onAskAI && (
                <button
                  onClick={() => onAskAI(careerId, career.title)}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-background/50 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Ask AI
                </button>
              )}
            </div>
          </div>

          {career.required_education && Object.keys(career.required_education).length > 0 && (
            <Section title="Required Education" icon={<GraduationCap className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {Object.entries(career.required_education).map(([key, val]) => (
                  <span key={key} className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-light">
                    <span className="capitalize">{key.replace("_", " ")}:</span> {val}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {career.typical_skills && Object.keys(career.typical_skills).length > 0 && (
            <Section title="Typical Skills" icon={<Wrench className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {Object.entries(career.typical_skills).map(([key, val]) => (
                  <span key={key} className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                    {key} <span className="text-accent">({val})</span>
                  </span>
                ))}
              </div>
            </Section>
          )}

          {career.skills.length > 0 && (
            <Section title="Skills" icon={<BookOpen className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {career.skills.map((skill) => (
                  <span key={skill.id} className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                    {skill.name}
                    {skill.category && <span className="ml-1 text-accent">({skill.category})</span>}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {career.degrees.length > 0 && (
            <Section title="Relevant Degrees" icon={<GraduationCap className="h-4 w-4" />}>
              <div className="space-y-2">
                {career.degrees.map((deg) => (
                  <div key={deg.id} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="font-medium">{deg.name}</span>
                    {deg.level && <span className="rounded bg-border px-1.5 py-0.5 text-xs text-text-secondary">{deg.level}</span>}
                    {deg.field && <span className="text-xs text-text-muted">{deg.field}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {career.colleges.length > 0 && (
            <Section title="Recommended Colleges" icon={<Landmark className="h-4 w-4" />}>
              <div className="grid gap-2 md:grid-cols-2">
                {career.colleges.map((college) => (
                  <div key={college.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{college.name}</p>
                        {college.location && (
                          <p className="flex items-center gap-1 text-xs text-text-secondary">
                            <MapPin className="h-3 w-3" /> {college.location}
                          </p>
                        )}
                      </div>
                      {college.ranking && (
                        <span className="rounded bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-light">
                          #{college.ranking}
                        </span>
                      )}
                    </div>
                    {college.website && (
                      <a href={college.website} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-xs text-accent hover:text-accent-light">
                        <ExternalLink className="h-3 w-3" /> Website
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {career.exams.length > 0 && (
            <Section title="Entrance Exams" icon={<BookOpen className="h-4 w-4" />}>
              <div className="space-y-2">
                {career.exams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{exam.name}</p>
                      {exam.description && <p className="text-xs text-text-secondary">{exam.description}</p>}
                    </div>
                    {exam.website && (
                      <a href={exam.website} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:text-accent-light">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {career.scholarships.length > 0 && (
            <Section title="Scholarships" icon={<Award className="h-4 w-4" />}>
              <div className="space-y-2">
                {career.scholarships.map((sch) => (
                  <div key={sch.id} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium text-foreground">{sch.name}</p>
                    {sch.description && <p className="text-xs text-text-secondary">{sch.description}</p>}
                    {sch.amount && <p className="mt-1 text-xs font-medium text-emerald-400">${sch.amount.toLocaleString()}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {career.resources.length > 0 && (
            <Section title="Resources" icon={<ExternalLink className="h-4 w-4" />}>
              <div className="space-y-2">
                {career.resources.map((res) => (
                  <div key={res.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{res.title}</p>
                      {res.description && <p className="text-xs text-text-secondary">{res.description}</p>}
                      {res.resource_type && (
                        <span className="mt-1 inline-block rounded bg-border px-1.5 py-0.5 text-[10px] text-text-secondary">
                          {res.resource_type}
                        </span>
                      )}
                    </div>
                    {res.url && (
                      <a href={normalizeUrl(res.url)} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-light">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      ) : null}
    </Modal>
  );
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url);
      if (u.hostname === "search") {
        return `https://www.google.com/search${u.search}`;
      }
    } catch {}
    return url;
  }
  if (/^www\./i.test(url)) return `https://${url}`;
  if (/^search[/?]/i.test(url)) {
    const qs = url.replace(/^search[/?]/i, "?");
    return `https://www.google.com/search${qs}`;
  }
  return `https://${url}`;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}
