#!/usr/bin/perl

use strict;
use Data::Dumper;
use JSON;
use Getopt::Long;
use XML::Simple;

my $help;
my $ruleFile;
my $catFile;

if(
     !GetOptions (
            "help|h" => \$help ,
            "rules|r=s" => \$ruleFile ,
            "cats|c=s" => \$catFile ,
     )
     || defined( $help )  ### or help is wanted
     || !defined( $ruleFile )
) {
        usage( );
}


sub usage {

   print "Usage $0 [OPTIONS]
   Generates scored categories
            --help|-h       - prints this help
            --rules|-r     - input rules count file
            --cats|-c      - produce database dump
            \n";
    exit 1;
}


my $rules = {};

sub addRule {
  my $line = shift;
  my ($term,$cnt) = split(/,/, $line);
  my $id = $term;
  my $cat = "ALL";
  if ($term =~ /:/) {
    ($id, $cat) = split(/:/, $term);
  }
  $rules->{$id}->{$cat} = $cnt;
}

sub readRulesData {
  open(FILE,"< $ruleFile");
  while(<FILE>) {
    chomp($_);
    addRule($_);
  }
  close(FILE);
}

sub pruneRules() {
  # remove rules that are useless
  while (my ($term, $cat) = each %$rules) {
    my @catKeys = keys %$cat;
    if (scalar(@catKeys) < 2 || !$cat->{'ALL'}) {
      delete $rules->{$term};
    }
    else {
      for my $key (@catKeys) {
        $cat->{$key} += 0;
      }
    }
  }
}

readRulesData();
pruneRules();

#print Dumper($rules);

my $json = JSON->new();
print $json->encode($rules);
