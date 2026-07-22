"use client";

import { useState, useEffect } from "react";
import type { CareerDetail } from "@/types/career";
import { getCareerById } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import { DollarSign, GraduationCap, MapPin, ExternalLink, BookOpen, Award, Landmark, Wrench, Info } from "lucide-react";

interface CareerDetailModalProps {
  careerId: string;
  onClose: () => void;
}

export default function CareerDetailModal({ careerId, onClose }: CareerDetailModalProps) {
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : career ? (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{career.description}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
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
          </div>

          {career.required_education && Object.keys(career.required_education).length > 0 && (
            <Section title="Required Education" icon={<GraduationCap className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {Object.entries(career.required_education).map(([key, val]) => (
                  <span key={key} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
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
                  <span key={key} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {key} <span className="text-indigo-400 dark:text-indigo-500">({val})</span>
                  </span>
                ))}
              </div>
            </Section>
          )}

          {career.skills.length > 0 && (
            <Section title="Skills" icon={<BookOpen className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {career.skills.map((skill) => (
                  <span key={skill.id} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {skill.name}
                    {skill.category && <span className="ml-1 text-indigo-400 dark:text-indigo-500">({skill.category})</span>}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {career.degrees.length > 0 && (
            <Section title="Relevant Degrees" icon={<GraduationCap className="h-4 w-4" />}>
              <div className="space-y-2">
                {career.degrees.map((deg) => (
                  <div key={deg.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{deg.name}</span>
                    {deg.level && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">{deg.level}</span>}
                    {deg.field && <span className="text-xs text-gray-400 dark:text-gray-500">{deg.field}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {career.colleges.length > 0 && (
            <Section title="Recommended Colleges" icon={<Landmark className="h-4 w-4" />}>
              <div className="grid gap-2 md:grid-cols-2">
                {career.colleges.map((college) => (
                  <div key={college.id} className="rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{college.name}</p>
                        {college.location && (
                          <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <MapPin className="h-3 w-3" /> {college.location}
                          </p>
                        )}
                      </div>
                      {college.ranking && (
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                          #{college.ranking}
                        </span>
                      )}
                    </div>
                    {college.website && (
                      <a href={college.website} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
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
                  <div key={exam.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{exam.name}</p>
                      {exam.description && <p className="text-xs text-gray-500 dark:text-gray-400">{exam.description}</p>}
                    </div>
                    {exam.website && (
                      <a href={exam.website} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
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
                  <div key={sch.id} className="rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{sch.name}</p>
                    {sch.description && <p className="text-xs text-gray-500 dark:text-gray-400">{sch.description}</p>}
                    {sch.amount && <p className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">${sch.amount.toLocaleString()}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {career.resources.length > 0 && (
            <Section title="Resources" icon={<ExternalLink className="h-4 w-4" />}>
              <div className="space-y-2">
                {career.resources.map((res) => (
                  <div key={res.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{res.title}</p>
                      {res.description && <p className="text-xs text-gray-500 dark:text-gray-400">{res.description}</p>}
                      {res.resource_type && (
                        <span className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          {res.resource_type}
                        </span>
                      )}
                    </div>
                    {res.url && (
                      <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
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

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}
